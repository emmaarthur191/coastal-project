import React from 'react';

const SettingsModal = ({
  showSettings,
  setShowSettings,
  currentTheme,
  setCurrentTheme,
  notificationsEnabled,
  setNotificationsEnabled,
  themes
}) => {
  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Settings</h3>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select
              value={currentTheme}
              onChange={(e) => setCurrentTheme(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(themes).map(([key, theme]) => (
                <option key={key} value={key}>{theme.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <span className="text-sm">Enable notifications</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Keyboard Shortcuts</label>
            <div className="text-sm text-gray-600 space-y-1">
              <p><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Alt+←</kbd> Go back</p>
              <p><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+K</kbd> Search messages</p>
              <p><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+N</kbd> New thread</p>
              <p><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+/</kbd> Focus message input</p>
              <p><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> Close modals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;