import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api.ts';

function ChatSupportSection() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('queue'); // 'queue', 'active', 'analytics'
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchChatSessions();
    fetchAnalytics();

    // Cleanup WebSocket on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('chat/sessions/');
      setChatSessions(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('chat/analytics/summary/');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const response = await api.get(`chat/sessions/${sessionId}/messages/`);
      setMessages(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const connectWebSocket = (sessionId) => {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Create new WebSocket connection
    const wsUrl = `ws://localhost:8000/ws/chat/support/${sessionId}/`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'chat_message':
        setMessages(prev => [...prev, data.message]);
        break;
      case 'typing_start':
        // Handle typing indicator
        break;
      case 'typing_stop':
        // Handle typing indicator stop
        break;
      case 'read_receipt':
        // Handle read receipts
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeSession) return;

    try {
      const messageData = {
        type: 'chat_message',
        content: newMessage.trim(),
        message_type: 'text'
      };

      // Send via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(messageData));
      }

      // Also send via API for persistence
      await api.post(`chat/sessions/${activeSession.id}/messages/`, {
        content: newMessage.trim(),
        message_type: 'text'
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const assignSession = async (sessionId, cashierId) => {
    try {
      await api.post(`chat/sessions/${sessionId}/assign/`, {
        cashier_id: cashierId
      });
      fetchChatSessions();
    } catch (error) {
      console.error('Error assigning session:', error);
    }
  };

  const closeSession = async (sessionId) => {
    try {
      await api.post(`chat/sessions/${sessionId}/close/`, {
        notes: 'Session closed by cashier'
      });
      setActiveSession(null);
      fetchChatSessions();
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  const selectSession = (session) => {
    setActiveSession(session);
    fetchMessages(session.id);
    connectWebSocket(session.id);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--md-sys-color-secondary)';
      case 'waiting': return 'var(--md-sys-color-tertiary)';
      case 'closed': return 'var(--md-sys-color-error)';
      default: return 'var(--md-sys-color-on-surface-variant)';
    }
  };

  return (
    <div className="md-elevated-card md-animate-slide-in-right" style={{ animationDelay: '200ms' }}>
      <h3 className="md-typescale-title-large" style={{
        color: 'var(--md-sys-color-on-surface)',
        marginBottom: '24px'
      }}>
        💬 Chat Support Center
      </h3>

      {/* View Selector */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        padding: '4px',
        background: 'var(--md-sys-color-surface-container-highest)',
        borderRadius: 'var(--md-sys-shape-corner-large)'
      }}>
        {[
          { id: 'queue', name: 'Queue', icon: '📋' },
          { id: 'active', name: 'Active Chats', icon: '💬' },
          { id: 'analytics', name: 'Analytics', icon: '📊' }
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className="md-ripple"
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeView === view.id ? 'var(--md-sys-color-surface)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              color: activeView === view.id ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: activeView === view.id ? '600' : '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
              boxShadow: activeView === view.id ? 'var(--md-sys-elevation-1)' : 'none'
            }}
          >
            <span style={{ fontSize: '20px' }}>{view.icon}</span>
            <span className="md-typescale-label-large">{view.name}</span>
          </button>
        ))}
      </div>

      {/* Queue View */}
      {activeView === 'queue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Session Queue */}
          <div>
            <h4 className="md-typescale-title-medium" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '16px'
            }}>
              Waiting Sessions
            </h4>
            <div style={{
              maxHeight: '500px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {chatSessions.filter(s => s.status === 'waiting').length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--md-sys-color-on-surface-variant)'
                }}>
                  <p className="md-typescale-body-medium">No sessions in queue</p>
                </div>
              ) : (
                chatSessions.filter(s => s.status === 'waiting').map((session) => (
                  <div
                    key={session.id}
                    onClick={() => selectSession(session)}
                    className="md-list-item md-ripple"
                    style={{
                      padding: '16px',
                      background: 'var(--md-sys-color-surface-container-low)',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      cursor: 'pointer',
                      border: activeSession?.id === session.id ? '2px solid var(--md-sys-color-primary)' : 'none'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="md-typescale-title-small" style={{
                        color: 'var(--md-sys-color-on-surface)',
                        marginBottom: '4px'
                      }}>
                        {session.customer_name || 'Anonymous Customer'}
                      </div>
                      <div className="md-typescale-body-small" style={{
                        color: 'var(--md-sys-color-on-surface-variant)',
                        marginBottom: '4px'
                      }}>
                        {session.subject || 'General Inquiry'}
                      </div>
                      <div className="md-typescale-body-small" style={{
                        color: 'var(--md-sys-color-on-surface-variant)'
                      }}>
                        {new Date(session.started_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: getStatusColor(session.status),
                      flexShrink: 0
                    }} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div>
            {activeSession ? (
              <div style={{
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--md-sys-color-outline)',
                borderRadius: 'var(--md-sys-shape-corner-medium)'
              }}>
                {/* Chat Header */}
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--md-sys-color-outline)',
                  background: 'var(--md-sys-color-surface-container-low)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="md-typescale-title-medium" style={{
                        color: 'var(--md-sys-color-on-surface)',
                        marginBottom: '4px'
                      }}>
                        {activeSession.customer_name || 'Anonymous Customer'}
                      </div>
                      <div className="md-typescale-body-small" style={{
                        color: 'var(--md-sys-color-on-surface-variant)'
                      }}>
                        {activeSession.subject || 'General Inquiry'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => assignSession(activeSession.id, user.id)}
                        className="md-filled-button md-ripple"
                        style={{
                          background: 'var(--md-sys-color-primary)',
                          color: 'var(--md-sys-color-on-primary)',
                          padding: '8px 16px'
                        }}
                      >
                        Assign to Me
                      </button>
                      <button
                        onClick={() => closeSession(activeSession.id)}
                        className="md-outlined-button md-ripple"
                        style={{ padding: '8px 16px' }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        alignSelf: message.sender === user.email ? 'flex-end' : 'flex-start',
                        maxWidth: '70%'
                      }}
                    >
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        background: message.sender === user.email
                          ? 'var(--md-sys-color-primary)'
                          : 'var(--md-sys-color-surface-container-high)',
                        color: message.sender === user.email
                          ? 'var(--md-sys-color-on-primary)'
                          : 'var(--md-sys-color-on-surface)'
                      }}>
                        <div className="md-typescale-body-medium" style={{ marginBottom: '4px' }}>
                          {message.content}
                        </div>
                        <div className="md-typescale-body-small" style={{
                          opacity: 0.7,
                          fontSize: '12px'
                        }}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div style={{
                  padding: '16px',
                  borderTop: '1px solid var(--md-sys-color-outline)',
                  background: 'var(--md-sys-color-surface-container-low)'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className="md-filled-text-field"
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        background: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)'
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="md-filled-button md-ripple"
                      style={{
                        background: !newMessage.trim()
                          ? 'var(--md-sys-color-surface-container-high)'
                          : 'var(--md-sys-color-primary)',
                        color: !newMessage.trim()
                          ? 'var(--md-sys-color-on-surface-variant)'
                          : 'var(--md-sys-color-on-primary)',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        padding: '12px 24px',
                        cursor: !newMessage.trim() ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                height: '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed var(--md-sys-color-outline)',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                color: 'var(--md-sys-color-on-surface-variant)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                  <p className="md-typescale-body-large">Select a session to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Chats View */}
      {activeView === 'active' && (
        <div>
          <h4 className="md-typescale-title-medium" style={{
            color: 'var(--md-sys-color-on-surface)',
            marginBottom: '16px'
          }}>
            Active Chat Sessions
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {chatSessions.filter(s => s.status === 'active').map((session) => (
              <div
                key={session.id}
                onClick={() => selectSession(session)}
                className="md-filled-card md-ripple"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: activeSession?.id === session.id ? '2px solid var(--md-sys-color-primary)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="md-typescale-title-medium" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '4px'
                    }}>
                      {session.customer_name || 'Anonymous Customer'}
                    </div>
                    <div className="md-typescale-body-medium" style={{
                      color: 'var(--md-sys-color-on-surface-variant)',
                      marginBottom: '8px'
                    }}>
                      {session.subject || 'General Inquiry'}
                    </div>
                    <div className="md-typescale-body-small" style={{
                      color: 'var(--md-sys-color-on-surface-variant)'
                    }}>
                      {session.message_count} messages • {new Date(session.last_message_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: getStatusColor(session.status),
                    flexShrink: 0
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics View */}
      {activeView === 'analytics' && analytics && (
        <div>
          <h4 className="md-typescale-title-medium" style={{
            color: 'var(--md-sys-color-on-surface)',
            marginBottom: '16px'
          }}>
            Chat Analytics Summary
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div className="md-filled-card" style={{ padding: '16px' }}>
              <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Total Sessions Today
              </div>
              <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                {analytics.total_sessions}
              </div>
            </div>
            <div className="md-filled-card" style={{ padding: '16px' }}>
              <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Active Sessions
              </div>
              <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                {analytics.active_sessions}
              </div>
            </div>
            <div className="md-filled-card" style={{ padding: '16px' }}>
              <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Total Messages
              </div>
              <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                {analytics.total_messages}
              </div>
            </div>
            <div className="md-filled-card" style={{ padding: '16px' }}>
              <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Average Satisfaction
              </div>
              <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                {analytics.average_satisfaction ? `${analytics.average_satisfaction}/5` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatSupportSection;