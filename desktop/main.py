"""
Coastal Banking - Windows Desktop Client
A secure wrapper that loads the live web application in a native window.
"""
import webview
import sys
import os

# Configuration
APP_NAME = "Coastal Banking"
APP_URL = "https://coastal-project.onrender.com"
WINDOW_WIDTH = 1280
WINDOW_HEIGHT = 800
MIN_WIDTH = 800
MIN_HEIGHT = 600

def get_icon_path():
    """Get the path to the app icon, handling PyInstaller bundled mode."""
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        base_path = sys._MEIPASS
    else:
        # Running as script
        base_path = os.path.dirname(os.path.abspath(__file__))
    
    icon_path = os.path.join(base_path, 'assets', 'icon.ico')
    return icon_path if os.path.exists(icon_path) else None

def main():
    """Launch the desktop application."""
    # Create the main window
    window = webview.create_window(
        title=APP_NAME,
        url=APP_URL,
        width=WINDOW_WIDTH,
        height=WINDOW_HEIGHT,
        min_size=(MIN_WIDTH, MIN_HEIGHT),
        resizable=True,
        fullscreen=False,
        frameless=False,
        easy_drag=False,
        text_select=True,
    )
    
    # Start the application
    # Use EdgeChromium on Windows for best compatibility
    webview.start(
        private_mode=False,  # Allow cookies to persist (for login sessions)
        storage_path=os.path.join(os.path.expanduser('~'), '.coastal_banking'),
        debug=False,  # Set to True for development
    )

if __name__ == '__main__':
    main()
