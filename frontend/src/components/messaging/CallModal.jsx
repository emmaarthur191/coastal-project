import React from 'react';
import UserAvatar from './UserAvatar';

const CallModal = ({
  showCallModal,
  setShowCallModal,
  callType,
  selectedCallParticipants,
  setSelectedCallParticipants,
  selectedThread,
  user,
  startCall
}) => {
  if (!showCallModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-96 overflow-y-auto">
        <div className="text-center mb-4">
          <div className="text-6xl mb-4">
            {callType === 'video' ? '📹' : '🎤'}
          </div>
          <h3 className="text-lg font-bold mb-2">Secure {callType === 'video' ? 'Video' : 'Voice'} Call</h3>
          <p className="text-gray-600 mb-4">
            Select participants and start the call.
          </p>
        </div>
        <div className="mb-4">
          <h4 className="font-medium mb-2">Participants:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedThread?.participants?.filter(p => p.id !== user.id).map(participant => (
              <label key={participant.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedCallParticipants.some(p => p.id === participant.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCallParticipants(prev => [...prev, participant]);
                    } else {
                      setSelectedCallParticipants(prev => prev.filter(p => p.id !== participant.id));
                    }
                  }}
                />
                <UserAvatar user={participant} size={24} />
                <span>{participant.first_name} {participant.last_name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={startCall}
            disabled={selectedCallParticipants.length === 0}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Start Call ({selectedCallParticipants.length} participants)
          </button>
          <button
            onClick={() => setShowCallModal(false)}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;