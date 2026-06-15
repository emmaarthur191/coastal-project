import React from 'react';
import { X } from 'lucide-react';
import UserAvatar from './UserAvatar';

const SearchModal = ({
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  searchResults,
  decryptedMessages,
  _handleSearch,
}) => {
  if (!showSearch) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[32rem] overflow-hidden flex flex-col shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Search Messages
          </h3>
          <button
            onClick={() => setShowSearch(false)}
            className="text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 p-1 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-all duration-300"
            aria-label="Close search"
            title="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-900/20 border border-slate-350 dark:border-slate-800/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-amber-500/20 dark:focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white text-xs font-mono mb-4 transition-all duration-300 placeholder-slate-400 dark:placeholder-slate-655"
          placeholder="Search messages..."
          autoFocus
        />

        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
          {searchResults.map((message) => (
            <div
              key={message.id}
              className="p-3.5 bg-slate-50 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-800/40 hover:border-slate-355 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl cursor-pointer transition-all duration-300"
              onClick={() => {
                // Scroll to message
                const messageElement = document.getElementById(`message-${message.id}`);
                messageElement?.scrollIntoView({ behavior: 'smooth' });
                setShowSearch(false);
              }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <UserAvatar user={message.sender} size={20} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {message.sender_name}
                </span>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                  {new Date(message.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-650 dark:text-slate-350 leading-relaxed font-sans">
                {decryptedMessages.get(message.id) || 'Decrypting...'}
              </p>
            </div>
          ))}
          {searchQuery && searchResults.length === 0 && (
            <p className="text-center text-[10px] font-black text-slate-450 dark:text-slate-550 py-12 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/60">
              No messages matching criteria
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
