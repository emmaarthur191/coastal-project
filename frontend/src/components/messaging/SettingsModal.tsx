import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Settings, Volume2, VolumeX, Eye, EyeOff, Shield, Users, X } from 'lucide-react';

interface Theme {
  name: string;
  [key: string]: any;
}

interface SettingsModalProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  currentTheme: string;
  setCurrentTheme: (theme: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  themes: Record<string, Theme>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettings,
  setShowSettings,
  currentTheme,
  setCurrentTheme,
  notificationsEnabled,
  setNotificationsEnabled,
  themes
}) => {
  const [preferences, setPreferences] = useState({
    sound_enabled: true,
    notification_sound: 'default',
    read_receipts_enabled: true,
    typing_indicators_enabled: true,
    last_seen_visible: true,
    auto_delete_enabled: false,
    auto_delete_days: 30,
    markdown_enabled: true,
    emoji_shortcuts_enabled: true,
    font_size: 'medium'
  });

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Load preferences and blocked users
  useEffect(() => {
    if (showSettings) {
      loadPreferences();
      loadBlockedUsers();
    }
  }, [showSettings]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('messaging/preferences/');
      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedUsers = async () => {
    try {
      const response = await api.get('messaging/blocked-users/');
      setBlockedUsers(response.data);
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    }
  };

  const savePreferences = async (updates) => {
    try {
      setSaving(true);
      const response = await api.post('messaging/preferences/', updates);
      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await api.post('messaging/blocked-users/unblock/', { user_id: userId });
      setBlockedUsers(blockedUsers.filter(u => u.blocked !== userId));
    } catch (error) {
      console.error('Failed to unblock user:', error);
      alert('Failed to unblock user');
    }
  };

  const updatePreference = (key, value) => {
    const updates = { ...preferences, [key]: value };
    setPreferences(updates);
    savePreferences({ [key]: value });
  };

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Messaging Settings</h3>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'privacy', label: 'Privacy', icon: Shield },
            { id: 'blocked', label: 'Blocked Users', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading settings...</p>
            </div>
          ) : (
            <>
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Theme</label>
                    <select
                      value={currentTheme}
                      onChange={(e) => setCurrentTheme(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {Object.entries(themes).map(([key, theme]) => (
                        <option key={key} value={key}>{theme.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sound Settings */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Sound & Notifications</label>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center space-x-3">
                          {preferences.sound_enabled ? <Volume2 className="w-5 h-5 text-blue-600" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sound enabled</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.sound_enabled}
                          onChange={(e) => updatePreference('sound_enabled', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      {preferences.sound_enabled && (
                        <div className="ml-8">
                          <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">Notification Sound</label>
                          <select
                            value={preferences.notification_sound}
                            onChange={(e) => updatePreference('notification_sound', e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-sm"
                          >
                            <option value="default">Default</option>
                            <option value="chime">Chime</option>
                            <option value="ding">Ding</option>
                            <option value="bell">Bell</option>
                            <option value="none">Silent</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Formatting */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Message Formatting</label>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Markdown formatting</span>
                        <input
                          type="checkbox"
                          checked={preferences.markdown_enabled}
                          onChange={(e) => updatePreference('markdown_enabled', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Emoji shortcuts</span>
                        <input
                          type="checkbox"
                          checked={preferences.emoji_shortcuts_enabled}
                          onChange={(e) => updatePreference('emoji_shortcuts_enabled', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">Font Size</label>
                        <select
                          value={preferences.font_size}
                          onChange={(e) => updatePreference('font_size', e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-sm"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Keyboard Shortcuts */}
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Keyboard Shortcuts</label>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-3">
                      <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Alt+←</kbd> Go back</p>
                      <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+K</kbd> Search messages</p>
                      <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+N</kbd> New thread</p>
                      <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+/</kbd> Focus message input</p>
                      <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Esc</kbd> Close modals</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Privacy Controls</label>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div>
                          <div className="flex items-center space-x-3">
                            <Eye className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Read receipts</span>
                          </div>
                          <p className="text-xs text-gray-500 dark-gray-400 mt-1 ml-8">Let others know when you've read their messages</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.read_receipts_enabled}
                          onChange={(e) => updatePreference('read_receipts_enabled', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Typing indicators</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Show when you're typing</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.typing_indicators_enabled}
                          onChange={(e) => updatePreference('typing_indicators_enabled', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last seen</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Show your online status</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.last_seen_visible}
                          onChange={(e) => updatePreference('last_seen_visible', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Auto-Delete Messages</label>
                    <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable auto-delete</span>
                      <input
                        type="checkbox"
                        checked={preferences.auto_delete_enabled}
                        onChange={(e) => updatePreference('auto_delete_enabled', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>

                    {preferences.auto_delete_enabled && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">Delete messages after</label>
                        <select
                          value={preferences.auto_delete_days}
                          onChange={(e) => updatePreference('auto_delete_days', parseInt(e.target.value))}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-sm"
                        >
                          <option value={1}>24 Hours</option>
                          <option value={7}>7 Days</option>
                          <option value={30}>30 Days</option>
                          <option value={90}>90 Days</option>
                          <option value={365}>Never</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Blocked Users Tab */}
              {activeTab === 'blocked' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Blocked users cannot send you messages or see your online status.
                  </p>

                  {blockedUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No blocked users</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {blockedUsers.map((blocked) => (
                        <div
                          key={blocked.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{blocked.blocked_full_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">@{blocked.blocked_username}</p>
                          </div>
                          <button
                            onClick={() => handleUnblock(blocked.blocked)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {saving && (
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
              <span className="animate-spin mr-2">⟳</span> Saving preferences...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
