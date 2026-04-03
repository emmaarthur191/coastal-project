import React from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface MessageThread {
  id: string | number;
  subject: string;
  participants?: any[];
  created_at: string;
}

export interface Message {
  id: string | number;
  content: string;
  is_me: boolean;
  sender_name?: string;
  created_at: string;
}

interface OperationalMessengerProps {
  threads: MessageThread[];
  selectedThread: MessageThread | null;
  messages: Message[];
  newMessage: string;
  onSelectThread: (thread: MessageThread) => void;
  onSendMessage: () => void;
  onNewMessageChange: (val: string) => void;
  onCreateThread?: (userId: string) => void;
  isProcessing?: string | number | null;
}

const OperationalMessenger: React.FC<OperationalMessengerProps> = ({
  threads,
  selectedThread,
  messages,
  newMessage,
  onSelectThread,
  onSendMessage,
  onNewMessageChange,
  onCreateThread,
  isProcessing
}) => {
  return (
    <div className="h-[calc(100vh-180px)] flex gap-6">
      {/* Sidebar - Threads List */}
      <GlassCard className="w-80 flex flex-col p-4 border-r-0 border-t-[6px] border-t-blue-400 h-full shadow-lg">
        <div className="flex justify-between items-center mb-6 px-2">
          <h4 className="font-black text-gray-800 text-sm uppercase tracking-widest">Conversations</h4>
          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">{threads.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {threads.length === 0 ? (
            <div className="text-center py-10 opacity-30">
              <p className="text-xs font-bold text-gray-400">No active threads</p>
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread)}
                className={`
                  p-4 rounded-2xl cursor-pointer transition-all border
                  ${selectedThread?.id === thread.id
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 border-transparent shadow-md'
                    : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'}
                `}
              >
                <div className={`font-bold text-sm truncate ${selectedThread?.id === thread.id ? 'text-white' : 'text-gray-800'}`}>
                  {thread.subject}
                </div>
                <div className={`text-[10px] mt-1 font-medium ${selectedThread?.id === thread.id ? 'text-blue-100/70' : 'text-gray-400'}`}>
                  {thread.participants?.length || 0} participants • {new Date(thread.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {onCreateThread && (
          <Button
            onClick={() => onCreateThread('staff-user-id')}
            className="mt-4 w-full h-11 text-xs font-bold shadow-blue-200 shadow-lg"
            variant="primary"
          >
            New Conversation 💬
          </Button>
        )}
      </GlassCard>

      {/* Main Chat Area */}
      <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden h-full shadow-xl border-0">
        {selectedThread ? (
          <>
            <div className="p-6 border-b border-gray-100 bg-white/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {selectedThread.subject.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-gray-800 text-lg leading-tight">
                    {selectedThread.subject}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    Internal Channel • Secure E2E
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30">
                  <p className="text-sm font-bold text-gray-400 italic">Start of message history</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.is_me ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                      max-w-[75%] p-4 rounded-3xl text-sm shadow-sm
                      ${message.is_me
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'}
                    `}>
                      {!message.is_me && message.sender_name && (
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-1">{message.sender_name}</p>
                      )}
                      <p className="leading-relaxed">{message.content}</p>
                      <p className={`text-[9px] mt-2 font-bold ${message.is_me ? 'text-blue-200/80' : 'text-gray-300'} text-right`}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-white/80 backdrop-blur-md flex gap-3">
              <Input
                value={newMessage}
                onChange={(e) => onNewMessageChange(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 h-12 rounded-2xl border-gray-200 focus:ring-blue-100"
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
              />
              <Button
                onClick={onSendMessage}
                variant="primary"
                className="w-12 h-12 p-0 flex items-center justify-center rounded-2xl shadow-blue-200 shadow-lg"
                disabled={!newMessage.trim() || isProcessing === 'sending'}
              >
                {isProcessing === 'sending' ? '...' : '🚀'}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
            <div className="w-24 h-24 rounded-full bg-white border-4 border-indigo-50 shadow-inner flex items-center justify-center mb-6">
              <div className="text-4xl animate-bounce">💬</div>
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-1">Select a Thread</h4>
            <p className="text-sm font-medium opacity-60">Pick a conversation from the left to start collaborating.</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default OperationalMessenger;
