import React, { useState } from 'react';
import UserAvatar from './UserAvatar';

const NewThreadModal = ({
  showNewThread,
  setShowNewThread,
  newThreadData,
  setNewThreadData,
  staffUsers,
  user,
  handleCreateThread,
  theme
}) => {
  if (!showNewThread) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold mb-4">Create New Thread</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Subject</label>
          <input
            type="text"
            value={newThreadData.subject}
            onChange={(e) => setNewThreadData(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter thread subject"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Participants</label>
          <div className="max-h-40 overflow-y-auto border rounded p-2">
            {staffUsers.filter(u => u.id !== user.id).map(staff => (
              <label key={staff.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newThreadData.participants.includes(staff.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setNewThreadData(prev => ({
                        ...prev,
                        participants: [...prev.participants, staff.id]
                      }));
                    } else {
                      setNewThreadData(prev => ({
                        ...prev,
                        participants: prev.participants.filter(id => id !== staff.id)
                      }));
                    }
                  }}
                />
                <UserAvatar user={staff} size={24} />
                <span>{staff.first_name} {staff.last_name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Initial Message (Optional)</label>
          <textarea
            value={newThreadData.initial_message}
            onChange={(e) => setNewThreadData(prev => ({ ...prev, initial_message: e.target.value }))}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Start the conversation..."
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              setShowNewThread(false);
              setNewThreadData({ participants: [], subject: '', initial_message: '' });
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateThread}
            disabled={!newThreadData.participants.length || !newThreadData.subject.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Create Thread
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewThreadModal;
