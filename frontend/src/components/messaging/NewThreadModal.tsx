import React from 'react';
import UserAvatar from './UserAvatar';

const NewThreadModal = ({
  showNewThread,
  setShowNewThread,
  newThreadData,
  setNewThreadData,
  staffUsers,
  user,
  handleCreateThread,
  _theme,
}) => {
  if (!showNewThread) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl transition-all duration-300">
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">
          Create New Thread
        </h3>

        <div className="mb-4">
          <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            Subject
          </label>
          <input
            type="text"
            value={newThreadData.subject}
            onChange={(e) => setNewThreadData((prev) => ({ ...prev, subject: e.target.value }))}
            className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-900/20 border border-slate-350 dark:border-slate-800/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-amber-500/20 dark:focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white text-xs font-mono transition-all duration-300 placeholder-slate-400 dark:placeholder-slate-650"
            placeholder="Enter thread subject"
          />
        </div>

        <div className="mb-4">
          <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            Participants
          </label>
          <div className="max-h-40 overflow-y-auto border border-slate-350 dark:border-slate-800/80 bg-white/30 dark:bg-slate-950/20 rounded-xl p-2 space-y-1">
            {staffUsers
              .filter((u) => u.id !== user.id)
              .map((staff) => (
                <label
                  key={staff.id}
                  className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={newThreadData.participants.includes(staff.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewThreadData((prev) => ({
                          ...prev,
                          participants: [...prev.participants, staff.id],
                        }));
                      } else {
                        setNewThreadData((prev) => ({
                          ...prev,
                          participants: prev.participants.filter((id) => id !== staff.id),
                        }));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-amber-500 dark:focus:ring-amber-500/20 cursor-pointer"
                  />
                  <UserAvatar user={staff} size={24} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    {staff.first_name} {staff.last_name}
                  </span>
                </label>
              ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            Initial Message (Optional)
          </label>
          <textarea
            value={newThreadData.initial_message}
            onChange={(e) =>
              setNewThreadData((prev) => ({ ...prev, initial_message: e.target.value }))
            }
            className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-900/20 border border-slate-350 dark:border-slate-800/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-amber-500/20 dark:focus:border-amber-500 focus:outline-none text-slate-900 dark:text-white text-xs font-mono transition-all duration-300 placeholder-slate-400 dark:placeholder-slate-650"
            rows={3}
            placeholder="Start the conversation..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowNewThread(false);
              setNewThreadData({ participants: [], subject: '', initial_message: '' });
            }}
            className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-black uppercase text-[9px] tracking-widest rounded-xl transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateThread}
            disabled={!newThreadData.participants.length || !newThreadData.subject.trim()}
            className="px-5 py-2.5 bg-blue-600 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-blue-700 dark:hover:bg-amber-600 disabled:bg-slate-200 dark:disabled:bg-slate-850 disabled:text-slate-450 dark:disabled:text-slate-650 disabled:cursor-not-allowed font-black uppercase text-[9px] tracking-widest rounded-xl transition-all duration-300 shadow-md hover:scale-[1.01]"
          >
            Create Thread
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewThreadModal;
