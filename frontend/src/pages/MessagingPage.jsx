import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Send, Plus, Search, Users, MessageCircle, ArrowLeft,
    Wifi, WifiOff, Check, CheckCheck
} from 'lucide-react';

// API base URL
const API_BASE_URL = '/api/';

// Helper to get CSRF token from cookies
const getCsrfToken = () => {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
};

/**
 * Simple WhatsApp-style Chat Page
 * Features: Room list, real-time messaging, direct & group chats
 */
export default function MessagingPage() {
    const { user } = useAuth();

    // State
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [staffUsers, setStaffUsers] = useState([]);

    // Refs
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Load rooms on mount
    useEffect(() => {
        loadRooms();
        loadStaffUsers();
    }, []);

    // API calls
    const loadRooms = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}chat/rooms/`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                // Handle both paginated {results: [...]} and array responses
                setRooms(data.results || data || []);
            }
        } catch (error) {
            console.error('Failed to load rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStaffUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}users/staff/`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setStaffUsers(data.results || data);
            }
        } catch (error) {
            console.error('Failed to load staff:', error);
        }
    };

    const loadMessages = async (roomId) => {
        try {
            const response = await fetch(`${API_BASE_URL}chat/rooms/${roomId}/messages/`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                // Reverse since API returns newest first
                setMessages((data.results || data).reverse());
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const createRoom = async (memberIds, name = '', isGroup = false) => {
        try {
            const csrfToken = getCsrfToken();
            const headers = { 'Content-Type': 'application/json' };
            if (csrfToken) {
                headers['X-CSRFToken'] = csrfToken;
            }
            const response = await fetch(`${API_BASE_URL}chat/rooms/create/`, {
                method: 'POST',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({
                    member_ids: memberIds,
                    name: name,
                    is_group: isGroup
                })
            });
            if (response.ok) {
                const room = await response.json();
                await loadRooms();
                selectRoom(room);
                setShowNewChat(false);
            }
        } catch (error) {
            console.error('Failed to create room:', error);
        }
    };

    // WebSocket connection
    const connectWebSocket = useCallback((roomId) => {
        // Cleanup existing connection
        if (socketRef.current) {
            socketRef.current.close();
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/chat/${roomId}/`;

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('[WS] Connected to room', roomId);
            setWsConnected(true);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'message') {
                    setMessages(prev => [...prev, {
                        id: data.id,
                        content: data.content,
                        sender: data.sender_id,
                        sender_name: data.sender_name,
                        created_at: data.timestamp,
                        is_own: data.sender_id === user?.id
                    }]);
                }
            } catch (e) {
                console.error('[WS] Parse error:', e);
            }
        };

        socket.onclose = () => {
            console.log('[WS] Disconnected');
            setWsConnected(false);
            // Auto-reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                if (selectedRoom?.id === roomId) {
                    connectWebSocket(roomId);
                }
            }, 3000);
        };

        socket.onerror = (error) => {
            console.error('[WS] Error:', error);
        };

        socketRef.current = socket;
    }, [user?.id, selectedRoom?.id]);

    // Room selection
    const selectRoom = (room) => {
        setSelectedRoom(room);
        setMessages([]);
        loadMessages(room.id);
        connectWebSocket(room.id);
    };

    // Send message
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedRoom || sending) return;

        const content = newMessage.trim();
        setNewMessage('');
        setSending(true);

        try {
            // Send via WebSocket if connected
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: 'message',
                    content: content
                }));
            } else {
                // Fallback to REST API
                await fetch(`${API_BASE_URL}chat/rooms/${selectedRoom.id}/messages/send/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ content })
                });
                await loadMessages(selectedRoom.id);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    // Filter users for new chat
    const filteredUsers = staffUsers.filter(u =>
        u.id !== user?.id &&
        (u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Styles
    const styles = {
        container: {
            display: 'flex',
            height: '100vh',
            background: '#0b141a',
            color: '#e9edef'
        },
        sidebar: {
            width: '350px',
            borderRight: '1px solid #222d34',
            display: 'flex',
            flexDirection: 'column',
            background: '#111b21'
        },
        sidebarHeader: {
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #222d34'
        },
        roomList: {
            flex: 1,
            overflowY: 'auto'
        },
        roomItem: {
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid #222d34',
            transition: 'background 0.2s'
        },
        roomItemHover: {
            background: '#202c33'
        },
        roomAvatar: {
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#00a884',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            fontSize: '18px',
            fontWeight: 'bold'
        },
        roomInfo: {
            flex: 1,
            overflow: 'hidden'
        },
        roomName: {
            fontWeight: '500',
            marginBottom: '4px'
        },
        roomPreview: {
            color: '#8696a0',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        chatArea: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#0b141a'
        },
        chatHeader: {
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            background: '#202c33',
            borderBottom: '1px solid #222d34'
        },
        messagesArea: {
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'64\' height=\'64\' viewBox=\'0 0 64 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M8 16c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm33.414-6l5.95-5.95L45.95.636 40 6.586 34.05.636 32.636 2.05 38.586 8l-5.95 5.95 1.414 1.414L40 9.414l5.95 5.95 1.414-1.414L41.414 8zM40 48c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zM9.414 40l5.95-5.95-1.414-1.414L8 38.586l-5.95-5.95L.636 34.05 6.586 40l-5.95 5.95 1.414 1.414L8 41.414l5.95 5.95 1.414-1.414L9.414 40z\' fill=\'%23182229\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
        },
        messageRow: {
            display: 'flex',
            marginBottom: '4px'
        },
        messageBubble: {
            maxWidth: '65%',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.4'
        },
        ownMessage: {
            background: '#005c4b',
            marginLeft: 'auto',
            borderBottomRightRadius: '2px'
        },
        otherMessage: {
            background: '#202c33',
            borderBottomLeftRadius: '2px'
        },
        senderName: {
            color: '#00a884',
            fontSize: '12px',
            marginBottom: '2px',
            fontWeight: '500'
        },
        messageTime: {
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '4px',
            textAlign: 'right'
        },
        inputArea: {
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#202c33'
        },
        input: {
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#2a3942',
            color: '#e9edef',
            fontSize: '14px',
            outline: 'none'
        },
        sendButton: {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: '#00a884',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        emptyState: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8696a0'
        },
        modal: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        },
        modalContent: {
            background: '#111b21',
            borderRadius: '8px',
            width: '400px',
            maxHeight: '500px',
            overflow: 'hidden'
        },
        modalHeader: {
            padding: '16px',
            borderBottom: '1px solid #222d34',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        searchInput: {
            width: '100%',
            padding: '10px 16px',
            border: 'none',
            background: '#2a3942',
            color: '#e9edef',
            borderRadius: '8px',
            outline: 'none',
            marginTop: '12px'
        },
        userList: {
            maxHeight: '350px',
            overflowY: 'auto'
        },
        userItem: {
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid #222d34'
        },
        connectionStatus: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: wsConnected ? '#00a884' : '#f15c6d'
        }
    };

    return (
        <div style={styles.container}>
            {/* Sidebar */}
            <div style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>Chats</h2>
                    <button
                        onClick={() => setShowNewChat(true)}
                        style={{ background: 'none', border: 'none', color: '#00a884', cursor: 'pointer' }}
                    >
                        <Plus size={24} />
                    </button>
                </div>

                <div style={styles.roomList}>
                    {loading ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#8696a0' }}>
                            Loading...
                        </div>
                    ) : rooms.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#8696a0' }}>
                            No chats yet. Start a new conversation!
                        </div>
                    ) : (
                        rooms.map(room => (
                            <div
                                key={room.id}
                                style={{
                                    ...styles.roomItem,
                                    background: selectedRoom?.id === room.id ? '#2a3942' : 'transparent'
                                }}
                                onClick={() => selectRoom(room)}
                            >
                                <div style={styles.roomAvatar}>
                                    {room.is_group ? <Users size={20} /> : room.display_name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div style={styles.roomInfo}>
                                    <div style={styles.roomName}>{room.display_name}</div>
                                    {room.last_message && (
                                        <div style={styles.roomPreview}>
                                            {room.last_message.sender_name}: {room.last_message.content}
                                        </div>
                                    )}
                                </div>
                                {room.unread_count > 0 && (
                                    <div style={{
                                        background: '#00a884',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 'bold'
                                    }}>
                                        {room.unread_count}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div style={styles.chatArea}>
                {selectedRoom ? (
                    <>
                        <div style={styles.chatHeader}>
                            <div style={{ ...styles.roomAvatar, width: '40px', height: '40px', marginRight: '12px' }}>
                                {selectedRoom.is_group ? <Users size={18} /> : selectedRoom.display_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500' }}>{selectedRoom.display_name}</div>
                                <div style={styles.connectionStatus}>
                                    {wsConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                                    {wsConnected ? 'Online' : 'Connecting...'}
                                </div>
                            </div>
                        </div>

                        <div style={styles.messagesArea}>
                            {messages.map((msg, idx) => {
                                const isOwn = msg.sender === user?.id || msg.is_own;
                                return (
                                    <div key={msg.id || idx} style={styles.messageRow}>
                                        <div style={{
                                            ...styles.messageBubble,
                                            ...(isOwn ? styles.ownMessage : styles.otherMessage)
                                        }}>
                                            {!isOwn && selectedRoom.is_group && (
                                                <div style={styles.senderName}>{msg.sender_name}</div>
                                            )}
                                            <div>{msg.content}</div>
                                            <div style={styles.messageTime}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isOwn && (msg.is_read ? <CheckCheck size={14} style={{ marginLeft: '4px' }} /> : <Check size={14} style={{ marginLeft: '4px' }} />)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} style={styles.inputArea}>
                            <input
                                type="text"
                                placeholder="Type a message"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                style={styles.input}
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                style={{
                                    ...styles.sendButton,
                                    opacity: newMessage.trim() && !sending ? 1 : 0.5
                                }}
                                disabled={!newMessage.trim() || sending}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={styles.emptyState}>
                        <MessageCircle size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 8px 0' }}>Coastal Chat</h3>
                        <p style={{ margin: 0 }}>Select a chat or start a new conversation</p>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChat && (
                <div style={styles.modal} onClick={() => setShowNewChat(false)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <button
                                onClick={() => setShowNewChat(false)}
                                style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer' }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h3 style={{ margin: 0 }}>New Chat</h3>
                        </div>
                        <div style={{ padding: '0 16px 16px' }}>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={styles.searchInput}
                            />
                        </div>
                        <div style={styles.userList}>
                            {filteredUsers.map(u => (
                                <div
                                    key={u.id}
                                    style={styles.userItem}
                                    onClick={() => createRoom([u.id])}
                                >
                                    <div style={{ ...styles.roomAvatar, width: '40px', height: '40px', marginRight: '12px' }}>
                                        {u.first_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '500' }}>
                                            {u.first_name} {u.last_name}
                                        </div>
                                        <div style={{ color: '#8696a0', fontSize: '13px' }}>{u.email}</div>
                                    </div>
                                </div>
                            ))}
                            {filteredUsers.length === 0 && (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#8696a0' }}>
                                    No users found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
