# VapourSynth Preview

A VS Code extension for recognizing and previewing VapourSynth scripts (`.vpy` files).

## Features

- **File Recognition**: Automatically associates `.vpy` files with Python language for syntax highlighting and IntelliSense
- **vspreview**: Preview VapourSynth script output with vspreview (`Ctrl+F5`)
- **Execute Script**: Run `.vpy` scripts directly in the terminal (`Ctrl+F6`)
- **Script Info**: View script output info with vspipe -i (`Ctrl+F7`)
- **Benchmark**: Run performance benchmarks with vspipe -p (`Ctrl+F8`)
- **Directory Selection**: Quickly select/switch VapourSynth directory via Command Palette or status bar
- **Status Bar**: Shows current VapourSynth configuration when editing `.vpy` files

## Getting Started

1. After installing, press `Ctrl+Shift+P` to open the Command Palette
2. Type `VapourSynth: Select VapourSynth Directory`
3. Select your VapourSynth installation directory (e.g. `C:\tools\vapoursynth`)
4. Open a `.vpy` file and use the keybindings to start working

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

```json
{
    "vapoursynth.directory": "C:\\tools\\vapoursynth"
}
```

The directory should contain:
- `python.exe` — Python interpreter bundled with VapourSynth
- `vspipe.exe` — VapourSynth pipe tool

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
