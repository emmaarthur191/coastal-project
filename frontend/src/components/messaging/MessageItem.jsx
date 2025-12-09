import React, { useState } from 'react';
import { CheckCheck, MessageCircle, Smile } from 'lucide-react';

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
    <div id={`message-${message.id}`} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
        isFromCurrentUser
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-900'
      }`}>
        {/* Reply indicator */}
        {message.reply_to_message && (
          <div className={`mb-2 p-2 rounded text-xs ${
            isFromCurrentUser ? 'bg-blue-600' : 'bg-gray-300'
          }`}>
            <div className="font-medium">{message.reply_to_message.sender_name}</div>
            <div className="truncate">{message.reply_to_message.content || '[Encrypted]'}</div>
          </div>
        )}

        {/* Forwarded indicator */}
        {message.forwarded_from_message && (
          <div className={`mb-1 text-xs opacity-70 ${
            isFromCurrentUser ? 'text-blue-200' : 'text-gray-600'
          }`}>
            Forwarded from {message.forwarded_from_message.sender_name}
          </div>
        )}

        {!isFromCurrentUser && (
          <div className="flex items-center mb-1">
            <UserAvatar user={message.sender} size={20} />
            <span className="ml-2 text-xs font-medium">{message.sender_name}</span>
          </div>
        )}
        <p className="text-sm">{decryptedContent}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs opacity-70">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {isFromCurrentUser && (
            <CheckCheck className="w-4 h-4 opacity-70" />
          )}
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {reactions.map((reaction, index) => {
              const hasUserReacted = reaction.users.some(u => u.id === user.id);
              return (
                <button
                  key={index}
                  onClick={() => hasUserReacted ? handleRemoveReaction(reaction.emoji) : handleAddReaction(reaction.emoji)}
                  className={`text-xs rounded px-2 py-1 transition-colors ${
                    hasUserReacted
                      ? (isFromCurrentUser ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800')
                      : (isFromCurrentUser ? 'bg-blue-600 bg-opacity-50 text-blue-200' : 'bg-white text-gray-700')
                  }`}
                  title={`${reaction.users.map(u => u.name).join(', ')} reacted with ${reaction.emoji}`}
                >
                  {reaction.emoji} {reaction.count}
                </button>
              );
            })}
          </div>
        )}

        {/* Message actions (visible on hover) */}
        <div className={`absolute ${isFromCurrentUser ? '-left-12' : '-right-12'} top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="p-1 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            title="Add reaction"
          >
            <Smile className="w-3 h-3" />
          </button>
          <button
            onClick={handleReply}
            className="p-1 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            title="Reply"
          >
            <MessageCircle className="w-3 h-3" />
          </button>
        </div>

        {/* Reaction picker */}
        {showReactionPicker && (
          <div className={`absolute ${isFromCurrentUser ? '-left-32' : '-right-32'} bottom-0 mb-2 p-2 bg-white border rounded shadow-lg z-10`}>
            <div className="flex gap-1">
              {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(emoji)}
                  className="text-lg hover:bg-gray-100 p-1 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;