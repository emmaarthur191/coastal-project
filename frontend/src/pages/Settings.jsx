import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function Settings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('system');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // This would typically call a settings API endpoint
      // For now, we'll show some sample settings
      const sampleSettings = [
        {
          key: 'max_daily_transactions',
          value: '1000',
          type: 'integer',
          description: 'Maximum transactions per day',
          category: 'transactions',
          is_active: true
        },
        {
          key: 'session_timeout',
          value: '3600',
          type: 'integer',
          description: 'Session timeout in seconds',
          category: 'security',
          is_active: true
        },
        {
          key: 'maintenance_mode',
          value: 'false',
          type: 'boolean',
          description: 'Enable maintenance mode',
          category: 'system',
          is_active: true
        },
        {
          key: 'email_notifications',
          value: 'true',
          type: 'boolean',
          description: 'Enable email notifications',
          category: 'notifications',
          is_active: true
        }
      ];
      setSettings(sampleSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, newValue) => {
    try {
      // This would call the backend to update the setting
      console.log(`Updating ${key} to ${newValue}...`);
      // For now, just update locally
      setSettings(prev => prev.map(setting =>
        setting.key === key ? { ...setting, value: newValue } : setting
      ));
      alert(`Setting ${key} updated successfully!`);
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Error updating setting. Please try again.');
    }
  };

  const filteredSettings = selectedCategory === 'all'
    ? settings
    : settings.filter(setting => setting.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'All Settings' },
    { value: 'system', label: 'System' },
    { value: 'security', label: 'Security' },
    { value: 'transactions', label: 'Transactions' },
    { value: 'notifications', label: 'Notifications' }
  ];

  const renderSettingInput = (setting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <select
            value={setting.value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        );
      case 'integer':
        return (
          <input
            type="number"
            value={setting.value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        );
      default:
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mauve-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-mauve-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">System Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredSettings.map(setting => (
              <div key={setting.key} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    <p className="text-gray-600 mt-1">{setting.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-500 capitalize">
                        Category: {setting.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        Type: {setting.type}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        setting.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {setting.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-6 w-64">
                    {renderSettingInput(setting)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSettings.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No settings found</h3>
              <p className="text-gray-500">Try selecting a different category.</p>
            </div>
          )}
        </div>

        {/* Save Settings Button */}
        <div className="mt-6 flex justify-end">
          <button className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;