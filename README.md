# VapourSynth Preview

A VS Code extension for recognizing and previewing VapourSynth scripts (`.vpy` files).

## Features

- **File Recognition**: Automatically associates `.vpy` files with Python language for syntax highlighting and IntelliSense
- **Python Interpreter Sync**: Automatically sets the Python extension's interpreter to VapourSynth's Python when editing `.vpy` files
- **vspreview**: Preview VapourSynth script output with vspreview (`Ctrl+F5`)
- **Execute Script**: Run `.vpy` scripts directly in the terminal (`Ctrl+F6`)
- **Script Info**: View script output info with vspipe -i (`Ctrl+F7`)
- **Benchmark**: Run performance benchmarks with vspipe -p (`Ctrl+F8`)

## Getting Started

1. After installing, open VS Code settings and set `vapoursynth.directory` to your VapourSynth installation directory (e.g. `C:\tools\vapoursynth`)
2. Open a `.vpy` file and use the keybindings to start working

## Keybindings

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+F5` | Preview | Launch vspreview |
| `Ctrl+F6` | Execute | Run script in terminal |
| `Ctrl+F7` | Info | Show script output info |
| `Ctrl+F8` | Bench | Run performance benchmark |

> Keybindings are only active when editing `.vpy` files.

## Configuration

Configure in VS Code settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `vapoursynth.directory` | `""` | Path to VapourSynth installation directory (containing `python.exe` and `vspipe.exe`) |
| `vapoursynth.pythonPath` | `""` | Path to Python executable. If empty, uses `python.exe` from the VapourSynth directory |

Example:

```json
{
    "vapoursynth.directory": "C:\\tools\\vapoursynth",
    "vapoursynth.pythonPath": ""
}
```

The directory should contain:
- `python.exe` — Python interpreter bundled with VapourSynth
- `vspipe.exe` — VapourSynth pipe tool

When a `.vpy` file is opened, the extension automatically sets `python.defaultInterpreterPath` (workspace scope) so that the Python extension uses VapourSynth's Python for IntelliSense and linting.

## Directory Structure Reference

Typical VapourSynth directory layout:

```
vapoursynth/
├── python.exe
├── vspipe.exe
├── vapoursynth64/
│   └── plugins/
└── ...
```

## Build & Install

```bash
npm install -g @vscode/vsce
npm install
npm run compile
vsce package
```

Then install the generated `.vsix` file in VS Code via "Install from VSIX...".
