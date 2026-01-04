import React from 'react';
import UserAvatar from './UserAvatar';

const SearchModal = ({
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  searchResults,
  decryptedMessages,
  handleSearch
}) => {
  if (!showSearch) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Search Messages</h3>
          <button
            onClick={() => setShowSearch(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search messages..."
          autoFocus
        />

        <div className="flex-1 overflow-y-auto">
          {searchResults.map(message => (
            <div
              key={message.id}
              className="p-3 border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                // Scroll to message
                const messageElement = document.getElementById(`message-${message.id}`);
                messageElement?.scrollIntoView({ behavior: 'smooth' });
                setShowSearch(false);
              }}
            >
              <div className="flex items-center space-x-2 mb-1">
                <UserAvatar user={message.sender} size={20} />
                <span className="font-medium">{message.sender_name}</span>
                <span className="text-sm text-gray-500">
                  {new Date(message.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                {decryptedMessages.get(message.id) || 'Decrypting...'}
              </p>
            </div>
          ))}
          {searchQuery && searchResults.length === 0 && (
            <p className="text-center text-gray-500 py-8">No messages found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
