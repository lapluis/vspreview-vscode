import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const isWindows = process.platform === 'win32';
const EXE_EXT = isWindows ? '.exe' : '';

function getConfig() {
    return vscode.workspace.getConfiguration('vapoursynth');
}

function getVspipePath(): string {
    const configured = getConfig().get<string>('vspipePath', '');
    if (configured) return configured;

    // Search in PATH for vspipe if not configured
    const exeName = `vspipe${EXE_EXT}`;
    const paths = (process.env.PATH || '').split(path.delimiter);
    for (const p of paths) {
        try {
            const candidate = path.join(p, exeName);
            if (fs.existsSync(candidate)) return candidate;
        } catch (e) { }
    }

    return '';
}

function getPythonPath(): string {
    const configured = getConfig().get<string>('pythonPath', '');
    if (configured) {
        return configured;
    }
    const vspipe = getVspipePath();
    if (vspipe) {
        return path.resolve(path.dirname(vspipe), `python${EXE_EXT}`);
    }
    return '';
}

function getActiveVpyFile(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return undefined;
    }
    const filePath = editor.document.fileName;
    if (!filePath.toLowerCase().endsWith('.vpy')) {
        vscode.window.showErrorMessage('Current file is not a .vpy file');
        return undefined;
    }
    // Save the file before running
    editor.document.save();
    return filePath;
}

async function ensureVspipeConfigured(): Promise<boolean> {
    const vspipe = getVspipePath();
    if (!vspipe) {
        const choice = await vscode.window.showErrorMessage(
            'Path to `vspipe` not configured and not found in PATH. Please set vapoursynth.vspipePath in Settings.',
            'Open Settings'
        );
        if (choice === 'Open Settings') {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'vapoursynth.vspipePath');
        }
        return false;
    }
    if (!fs.existsSync(vspipe)) {
        vscode.window.showErrorMessage(`vspipe executable not found: ${vspipe}`);
        return false;
    }
    return true;
}

async function ensurePythonExists(): Promise<boolean> {
    const py = getPythonPath();
    if (!py) {
        const choice = await vscode.window.showErrorMessage(
            'Python path not configured and cannot be inferred. Set `vapoursynth.pythonPath` or `vapoursynth.vspipePath` in Settings.',
            'Open Settings'
        );
        if (choice === 'Open Settings') {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'vapoursynth.pythonPath');
        }
        return false;
    }
    if (!fs.existsSync(py)) {
        vscode.window.showErrorMessage(`Python executable not found: ${py}`);
        return false;
    }
    return true;
}

function getTerminal(name: string): vscode.Terminal {
    // Reuse existing terminal with the same name
    const existing = vscode.window.terminals.find(t => t.name === name);
    if (existing) {
        return existing;
    }
    // Set up environment so VapourSynth's Python can find its modules
    const vspipe = getVspipePath();
    const env: { [key: string]: string } = {};

    if (vspipe) {
        const vspDir = path.dirname(vspipe);
        env['PATH'] = `${vspDir}${path.delimiter}${process.env.PATH || ''}`;
    }

    return vscode.window.createTerminal({
        name,
        env
    });
}

type ShellType = 'pwsh' | 'cmd' | 'unix';

function getShellType(): ShellType {
    if (!isWindows) return 'unix';
    const shell = (vscode.env.shell || '').toLowerCase();
    if (shell.includes('cmd.exe')) return 'cmd';
    return 'pwsh';
}

function quoteString(s: string, shellType: ShellType): string {
    if (shellType === 'pwsh') {
        return `'${s.replace(/'/g, "''")}'`;
    } else if (shellType === 'cmd') {
        return `"${s}"`;
    } else {
        return `"${s.replace(/"/g, '\\"')}"`;
    }
}

/**
 * Build a command string that correctly quotes the executable and arguments for the current shell.
 * If runDir is provided, the command will change to that directory before executing and then return.
 */
function buildCommand(exe: string, args: string[], runDir?: string): string {
    const shellType = getShellType();
    const quotedExe = quoteString(exe, shellType);
    const quotedArgs = args.map(arg => quoteString(arg, shellType)).join(' ');

    let cmd = '';
    if (shellType === 'pwsh') {
        cmd = `& ${quotedExe} ${quotedArgs}`;
        if (runDir) {
            cmd = `Push-Location -LiteralPath ${quoteString(runDir, shellType)}; ${cmd}; Pop-Location`;
        }
    } else if (shellType === 'cmd') {
        cmd = `${quotedExe} ${quotedArgs}`;
        if (runDir) {
            cmd = `cd /d ${quoteString(runDir, shellType)} && ${cmd}`;
        }
    } else {
        cmd = `${quotedExe} ${quotedArgs}`;
        if (runDir) {
            cmd = `(cd ${quoteString(runDir, shellType)} && ${cmd})`;
        }
    }

    return cmd;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('VapourSynth Preview extension activated');

    // Command: vspreview (Ctrl+F5)
    context.subscriptions.push(
        vscode.commands.registerCommand('vapoursynth.preview', async () => {
            const file = getActiveVpyFile();
            if (!file || !(await ensureVspipeConfigured()) || !(await ensurePythonExists())) return;

            const terminal = getTerminal('VS Preview');
            terminal.show();
            terminal.sendText(buildCommand(getPythonPath(), ['-m', 'vspreview', file]));
        })
    );

    // Command: Execute in Terminal (Ctrl+F6)
    context.subscriptions.push(
        vscode.commands.registerCommand('vapoursynth.execInTerminal', async () => {
            const file = getActiveVpyFile();
            if (!file || !(await ensureVspipeConfigured()) || !(await ensurePythonExists())) return;

            const terminal = getTerminal('VapourSynth');
            terminal.show();
            terminal.sendText(buildCommand(getPythonPath(), [file]));
        })
    );

    // Command: vspipe info (Ctrl+F7)
    context.subscriptions.push(
        vscode.commands.registerCommand('vapoursynth.info', async () => {
            const file = getActiveVpyFile();
            if (!file || !(await ensureVspipeConfigured())) return;

            const terminal = getTerminal('VS Info');
            terminal.show();
            terminal.sendText(buildCommand(getVspipePath(), ['-i', file]));
        })
    );

    // Command: vspipe benchmark (Ctrl+F8)
    context.subscriptions.push(
        vscode.commands.registerCommand('vapoursynth.bench', async () => {
            const file = getActiveVpyFile();
            if (!file || !(await ensureVspipeConfigured())) return;

            const fileDir = path.dirname(file);
            const terminal = getTerminal('VS Bench');
            terminal.show();
            terminal.sendText(buildCommand(getVspipePath(), ['-p', file, '.'], fileDir));
        })
    );

}

export function deactivate() { }
