import React from 'react';
import { Video, Mic } from 'lucide-react';
import UserAvatar from './UserAvatar';

const CallModal = ({
  showCallModal,
  setShowCallModal,
  callType,
  selectedCallParticipants,
  setSelectedCallParticipants,
  selectedThread,
  user,
  startCall,
}) => {
  if (!showCallModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[32rem] overflow-y-auto shadow-2xl transition-all duration-300">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center border border-blue-200/50 dark:border-amber-500/20 text-blue-600 dark:text-amber-500 transition-colors duration-300">
              {callType === 'video' ? <Video className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </div>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
            Secure {callType === 'video' ? 'Video' : 'Voice'} Call
          </h3>
          <p className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-tight mb-4">
            Select participants and start the secure channel.
          </p>
        </div>
        <div className="mb-6">
          <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
            Participants:
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {(selectedThread?.participant_list || [])
              .filter((p) => p.id !== user.id)
              .map((participant, index) => (
                <label
                  key={participant.id || index}
                  className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/60 rounded-xl cursor-pointer transition-all duration-300"
                >
                  <input
                    type="checkbox"
                    checked={selectedCallParticipants.some((p) => p.id === participant.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCallParticipants((prev) => [...prev, participant]);
                      } else {
                        setSelectedCallParticipants((prev) =>
                          prev.filter((p) => p.id !== participant.id)
                        );
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-amber-500 dark:focus:ring-amber-500/20 cursor-pointer"
                  />
                  <UserAvatar user={participant} size={24} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    {participant.first_name || participant.name} {participant.last_name || ''}
                  </span>
                </label>
              ))}
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowCallModal(false)}
            className="px-5 py-2.5 border border-slate-250 dark:border-slate-800 text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-black uppercase text-[9px] tracking-widest rounded-xl transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={startCall}
            disabled={selectedCallParticipants.length === 0}
            className="px-5 py-2.5 bg-blue-600 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-blue-700 dark:hover:bg-amber-600 disabled:bg-slate-200 dark:disabled:bg-slate-850 disabled:text-slate-450 dark:disabled:text-slate-600 disabled:cursor-not-allowed font-black uppercase text-[9px] tracking-widest rounded-xl transition-all duration-300 shadow-md hover:scale-[1.01]"
          >
            Start Call ({selectedCallParticipants.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
