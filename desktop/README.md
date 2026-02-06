# Coastal Banking - Desktop Client

A native Windows application that provides a secure, dedicated interface for staff to access the Coastal Banking system.

## Features

- **Secure Browser**: No address bar - users are locked into the banking application
- **Persistent Sessions**: Login cookies are saved locally for convenience
- **Native Feel**: Opens as a native Windows application, not a browser tab
- **Auto-Updates**: The app always loads the latest version from the cloud

## Prerequisites

- Python 3.10+
- Windows 10/11

## Development

### Install Dependencies

```bash
conda activate coastal_cu_env
pip install -r requirements.txt
```

### Run Locally (Development)

```bash
python main.py
```

### Build Executable

```bash
pyinstaller desktop.spec
```

The executable will be created at `dist/CoastalBanking.exe`.

## Distribution

1. Build the executable using the command above
2. Copy `dist/CoastalBanking.exe` to a shared location
3. Staff can download and run it directly (no installation required)

## Configuration

Edit `main.py` to change:

- `APP_URL`: The server URL (default: `https://coastal-project.onrender.com`)
- `WINDOW_WIDTH` / `WINDOW_HEIGHT`: Default window size
- `APP_NAME`: Window title

## Adding an Icon

1. Place your `.ico` file in `assets/icon.ico`
2. Rebuild the executable
