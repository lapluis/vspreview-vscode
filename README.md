# VapourSynth Preview

A VS Code extension for recognizing and previewing VapourSynth scripts (`.vpy` files).

## Features

- **File Recognition**: Automatically associates `.vpy` files with Python language for syntax highlighting and IntelliSense
- **vspreview**: Preview VapourSynth script output with vspreview (`Ctrl+F5`)
- **Execute Script**: Run `.vpy` scripts directly in the terminal (`Ctrl+F6`)
- **Script Info**: View script output info with vspipe -i (`Ctrl+F7`)
- **Benchmark**: Run performance benchmarks with vspipe -p (`Ctrl+F8`)

## Getting Started

1. The extension requires the [Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python) for syntax highlighting and IntelliSense (will be installed automatically as a dependency)
2. After installing, open VS Code settings and set `vapoursynth.vspipePath` to the full path of the `vspipe` executable (e.g. `C:\tools\vapoursynth\vspipe.exe`). You may also set `vapoursynth.pythonPath` to a specific Python executable.
3. Open a `.vpy` file and use the keybindings to start working

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
| `vapoursynth.vspipePath` | `""` | Full path to the `vspipe` executable (for example `C:\\tools\\vapoursynth\\vspipe.exe`). This is required for vspipe-based commands. |
| `vapoursynth.pythonPath` | `""` | Path to Python executable. If empty, the extension will try to infer the Python executable from the configured `vspipe` path using `../python{ext}` relative to `vspipe`. You can still set this manually. |

Example:

```json
{
    "vapoursynth.vspipePath": "C:\\tools\\vapoursynth\\vspipe.exe",
    "vapoursynth.pythonPath": ""
}
```

If you prefer not to set `pythonPath`, the extension will attempt to use the interpreter located at `../python{ext}` relative to the `vspipe` binary (this matches common VapourSynth layouts). If that inference fails, set `vapoursynth.pythonPath` explicitly.

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
