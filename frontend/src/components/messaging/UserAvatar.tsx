import React from 'react';

const UserAvatar = ({ user, size = 32, showStatus = false, onlineUsers = new Map(), theme = { colors: { primary: '#007bff', secondary: '#6c757d', surface: '#ffffff' } } }) => {
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : '?';
  const isOnline = onlineUsers.get(user?.id) === 'online';

  return (
    <div className="relative">
      <div
        className="rounded-full flex items-center justify-center font-semibold text-white"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
          fontSize: size * 0.4
        }}
      >
        {initials}
      </div>
      {showStatus && (
        <div
          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
          style={{ borderColor: theme.colors.surface }}
        />
      )}
    </div>
  );
};

export default UserAvatar;
