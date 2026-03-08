import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

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
    return path.join(getVapourSynthDir(), 'python.exe');
}

function getVspipePath(): string {
    return path.join(getVapourSynthDir(), 'vspipe.exe');
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
        vscode.window.showErrorMessage(`python.exe not found: ${getPythonPath()}`);
        return false;
    }
    return true;
}

function ensureVspipe(): boolean {
    if (!fs.existsSync(getVspipePath())) {
        vscode.window.showErrorMessage(`vspipe.exe not found: ${getVspipePath()}`);
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
    return vscode.window.createTerminal({
        name,
        env: {
            PATH: `${vsDir};${process.env.PATH}`
        }
    });
}

/**
 * Escape a path for PowerShell by wrapping in single quotes
 * and escaping any internal single quotes.
 */
function psQuote(s: string): string {
    return `'${s.replace(/'/g, "''")}'`;
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
            terminal.sendText(`& ${psQuote(getPythonPath())} -m vspreview ${psQuote(file)}`);
        })
    );

    // Command: Execute in Terminal (Ctrl+F6)
    context.subscriptions.push(
        vscode.commands.registerCommand('vapoursynth.execInTerminal', async () => {
            const file = getActiveVpyFile();
            if (!file || !(await ensureDirectory())) return;

            const terminal = getTerminal('VapourSynth');
            terminal.show();
            terminal.sendText(`& ${psQuote(getPythonPath())} ${psQuote(file)}`);
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
            terminal.sendText(`& ${psQuote(getVspipePath())} -i ${psQuote(file)}`);
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
            terminal.sendText(`Push-Location -LiteralPath ${psQuote(fileDir)}; & ${psQuote(getVspipePath())} -p ${psQuote(file)} .; Pop-Location`);
        })
    );

}

export function deactivate() { }
