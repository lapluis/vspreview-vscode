import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const isWindows = process.platform === 'win32';
const EXE_EXT = isWindows ? '.exe' : '';

function getConfig() {
    return vscode.workspace.getConfiguration('vapoursynth');
}

function getVapourSynthDir(): string {
    return getConfig().get<string>('directory', '');
}

function getPythonPath(): string {
    const configured = getConfig().get<string>('pythonPath', '');
    if (configured) {
        return configured;
    }
    return path.join(getVapourSynthDir(), `python${EXE_EXT}`);
}

function getVspipePath(): string {
    return path.join(getVapourSynthDir(), `vspipe${EXE_EXT}`);
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

async function ensureDirectory(): Promise<boolean> {
    const vsDir = getVapourSynthDir();
    if (!vsDir) {
        const choice = await vscode.window.showErrorMessage(
            'VapourSynth directory not configured. Please set vapoursynth.directory in Settings.',
            'Open Settings'
        );
        if (choice === 'Open Settings') {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'vapoursynth.directory');
        }
        return false;
    }
    if (!fs.existsSync(vsDir)) {
        vscode.window.showErrorMessage(`VapourSynth directory does not exist: ${vsDir}`);
        return false;
    }
    if (!fs.existsSync(getPythonPath())) {
        vscode.window.showErrorMessage(`Python executable not found: ${getPythonPath()}`);
        return false;
    }
    return true;
}

function ensureVspipe(): boolean {
    if (!fs.existsSync(getVspipePath())) {
        vscode.window.showErrorMessage(`vspipe executable not found: ${getVspipePath()}`);
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
    const vsDir = getVapourSynthDir();
    const env: { [key: string]: string } = {};

    if (vsDir) {
        env['PATH'] = `${vsDir}${path.delimiter}${process.env.PATH || ''}`;
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
            if (!file || !(await ensureDirectory())) return;

            const terminal = getTerminal('VS Preview');
            terminal.show();
            terminal.sendText(buildCommand(getPythonPath(), ['-m', 'vspreview', file]));
        })
    );

    // Command: Execute in Terminal (Ctrl+F6)
    context.subscriptions.push(
        vscode.commands.registerCommand('vapoursynth.execInTerminal', async () => {
            const file = getActiveVpyFile();
            if (!file || !(await ensureDirectory())) return;

            const terminal = getTerminal('VapourSynth');
            terminal.show();
            terminal.sendText(buildCommand(getPythonPath(), [file]));
        })
    );

    // Command: vspipe info (Ctrl+F7)
    context.subscriptions.push(
        vscode.commands.registerCommand('vapoursynth.info', async () => {
            const file = getActiveVpyFile();
            if (!file || !(await ensureDirectory())) return;
            if (!ensureVspipe()) return;

            const terminal = getTerminal('VS Info');
            terminal.show();
            terminal.sendText(buildCommand(getVspipePath(), ['-i', file]));
        })
    );

    // Command: vspipe benchmark (Ctrl+F8)
    context.subscriptions.push(
        vscode.commands.registerCommand('vapoursynth.bench', async () => {
            const file = getActiveVpyFile();
            if (!file || !(await ensureDirectory())) return;
            if (!ensureVspipe()) return;

            const fileDir = path.dirname(file);
            const terminal = getTerminal('VS Bench');
            terminal.show();
            terminal.sendText(buildCommand(getVspipePath(), ['-p', file, '.'], fileDir));
        })
    );

}

export function deactivate() { }
