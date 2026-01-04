import React, { useState } from 'react';
import { CheckCheck, MessageCircle, Smile, Reply, MoreVertical, Trash2 } from 'lucide-react';
import UserAvatar from './UserAvatar';

const MessageItem = ({
  message,
  user,
  decryptedMessages,
  messageReactions,
  setMessageReactions,
  authService,
  theme
}) => {
  const isFromCurrentUser = message.is_from_current_user || message.sender_id === user.id;
  const decryptedContent = decryptedMessages.get(message.id) || 'Decrypting...';
  const reactions = messageReactions.get(message.id) || [];
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleAddReaction = async (emoji) => {
    try {
      const result = await authService.addMessageReaction(message.id, emoji);
      if (result.success) {
        // Update local state immediately for better UX
        const currentReactions = messageReactions.get(message.id) || [];
        const existingReaction = currentReactions.find(r => r.emoji === emoji);

        if (existingReaction) {
          existingReaction.count += 1;
          if (!existingReaction.users.some(u => u.id === user.id)) {
            existingReaction.users.push({
              id: user.id,
              name: `${user.first_name} ${user.last_name}`
            });
          }
        } else {
          currentReactions.push({
            emoji: emoji,
            count: 1,
            users: [{
              id: user.id,
              name: `${user.first_name} ${user.last_name}`
            }]
          });
        }

        setMessageReactions(prev => new Map(prev.set(message.id, currentReactions)));
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
    setShowReactionPicker(false);
  };

  const handleRemoveReaction = async (emoji) => {
    try {
      const result = await authService.removeMessageReaction(message.id, emoji);
      if (result.success) {
        // Update local state immediately for better UX
        const currentReactions = messageReactions.get(message.id) || [];
        const existingReaction = currentReactions.find(r => r.emoji === emoji);

        if (existingReaction) {
          existingReaction.count -= 1;
          existingReaction.users = existingReaction.users.filter(u => u.id !== user.id);
          if (existingReaction.count <= 0) {
            const updatedReactions = currentReactions.filter(r => r.emoji !== emoji);
            setMessageReactions(prev => new Map(prev.set(message.id, updatedReactions)));
          } else {
            setMessageReactions(prev => new Map(prev.set(message.id, currentReactions)));
          }
        }
      }
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  };

  const handleReply = () => {
    // Reply functionality should be handled by parent component
    console.log('Reply to:', message.sender_name);
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-6 group relative`}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar for received messages */}
      {!isFromCurrentUser && (
        <div className="mr-3 flex-shrink-0 self-end mb-1">
          <UserAvatar user={message.sender} size={32} />
        </div>
      )}

      <div className={`relative max-w-[85%] lg:max-w-[70%] xl:max-w-[60%] flex flex-col ${isFromCurrentUser ? 'items-end' : 'items-start'}`}>

        {/* Helper Name for Group Chats (only if not from current user) */}
        {!isFromCurrentUser && (
          <span className="ml-1 mb-1 text-xs text-gray-500 font-medium">
            {message.sender_name}
          </span>
        )}

        {/* Message Bubble */}
        <div
          className={`px-5 py-3 rounded-2xl shadow-sm relative text-sm leading-relaxed ${isFromCurrentUser
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-none'
              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none'
            }`}
        >
          {/* Reply context */}
          {message.reply_to_message && (
            <div className={`mb-2 pl-3 border-l-2 py-1 text-xs rounded-r bg-black/5 dark:bg-white/5 ${isFromCurrentUser ? 'border-white/50 text-white/90' : 'border-blue-500 text-gray-600 dark:text-gray-300'
              }`}>
              <div className="font-bold opacity-75">{message.reply_to_message.sender_name}</div>
              <div className="truncate opacity-75">{message.reply_to_message.content || '[Encrypted]'}</div>
            </div>
          )}

          {/* Forwarded context */}
          {message.forwarded_from_message && (
            <div className={`mb-1 text-xs italic flex items-center gap-1 ${isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
              }`}>
              <Reply className="w-3 h-3 rotate-180" />
              Forwarded
            </div>
          )}

          {/* Content */}
          <div className="whitespace-pre-wrap break-words">
            {decryptedContent}
          </div>

          {/* Time & Read Status */}
          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isFromCurrentUser ? 'text-blue-100' : 'text-gray-400'
            }`}>
            <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {isFromCurrentUser && (
              <CheckCheck className={`w-3 h-3 ${message.is_read ? 'text-blue-200' : 'opacity-60'}`} />
            )}
          </div>

          {/* Reactions (displayed on the bubble edge) */}
          {reactions.length > 0 && (
            <div className={`absolute -bottom-3 ${isFromCurrentUser ? 'right-0' : 'left-0'} flex gap-1`}>
              {reactions.map((reaction, index) => {
                const hasUserReacted = reaction.users.some(u => u.id === user.id);
                return (
                  <button
                    key={index}
                    onClick={() => hasUserReacted ? handleRemoveReaction(reaction.emoji) : handleAddReaction(reaction.emoji)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] shadow-sm border ${hasUserReacted
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="font-semibold">{reaction.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Menu (Reply, React, etc.) - Floating beside bubble */}
        <div className={`absolute top-0 py-1 ${isFromCurrentUser
            ? '-left-24 pr-2'
            : '-right-24 pl-2'
          } opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1`}>

          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-blue-500 transition-colors shadow-sm"
            title="Add reaction"
          >
            <Smile className="w-4 h-4" />
          </button>

          <button
            onClick={handleReply}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-blue-500 transition-colors shadow-sm"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>

          {isFromCurrentUser && (
            <button
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-red-100 hover:text-red-500 transition-colors shadow-sm"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Reaction Picker Popover */}
          {showReactionPicker && (
            <div className={`absolute bottom-full mb-2 ${isFromCurrentUser ? 'right-0' : 'left-0'} p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200 z-50 flex gap-1`}>
              {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(emoji)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-xl transform hover:scale-110 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
