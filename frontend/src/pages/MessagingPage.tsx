import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import {
    Send, Plus, Search, Users, MessageSquare, ArrowLeft,
    MoreVertical, Phone, Mic, Smile,
    Check, CheckCheck
} from 'lucide-react';
import './MessagingPage.css';

import { authService } from '../services/api';

/**
 * WhatsApp Clone Messaging Page
 * Features: Exact WhatsApp dark mode styling, Emoji picker, functional buttons
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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [staffUsers, setStaffUsers] = useState([]);

    // Refs
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const emojiPickerRef = useRef(null);

    // Click outside emoji picker to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }); // 'auto' effectively creates instant scroll for that snappy feel
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Load rooms & staff on mount
    useEffect(() => {
        loadRooms();
        loadStaffUsers();
    }, []);

    // API calls
    const loadRooms = async () => {
        try {
            setLoading(true);
            const result = await authService.getChatRooms();
            if (result.success) {
                setRooms(result.data || []);
            }
        } catch (error) {
            console.error('Failed to load rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStaffUsers = async () => {
        try {
            const result = await authService.getStaffUsers();
            if (result.success) {
                setStaffUsers(result.data || []);
            }
        } catch (error) {
            console.error('Failed to load staff:', error);
        }
    };

    const loadMessages = async (roomId) => {
        try {
            const result = await authService.getChatMessages(roomId);
            if (result.success) {
                setMessages(result.data || []);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const createRoom = async (memberIds: (number | string)[], name = '', isGroup = false) => {
        try {
            const result = await authService.createChatRoom(memberIds, name, isGroup);
            if (result.success) {
                await loadRooms();
                selectRoom(result.data);
                setShowNewChat(false);
            }
        } catch (error) {
            console.error('Failed to create room:', error);
        }
    };

    // WebSocket
    const connectWebSocket = useCallback((roomId) => {
        // Clear any existing reconnection timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (socketRef.current) socketRef.current.close();

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/chat/${roomId}/`;
        console.warn('Connecting to WebSocket:', wsUrl);
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => setWsConnected(true);
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
            } catch (e) { console.error('WS Error', e); }
        };
        socket.onclose = () => {
            setWsConnected(false);
            // Attempt to reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                console.warn('Attempting to reconnect WebSocket...');
                connectWebSocket(roomId);
            }, 3000);
        };
        socketRef.current = socket;
    }, [user?.id]);

    const selectRoom = (room) => {
        setSelectedRoom(room);
        setMessages([]);
        loadMessages(room.id);
        connectWebSocket(room.id);
        setShowEmojiPicker(false); // Close emoji picker when switching
    };

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || !selectedRoom || sending) return;

        const content = newMessage.trim();
        setNewMessage('');
        setSending(true);
        setShowEmojiPicker(false);

        try {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ type: 'message', content }));
            } else {
                // REST Fallback (using authService)
                await authService.sendChatMessage(selectedRoom.id, content);
                loadMessages(selectedRoom.id);
            }
        } catch (error) {
            console.error('Send failed:', error);
        } finally {
            setSending(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clear reconnection timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            // Close WebSocket connection
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    const onEmojiClick = (emojiObject: { emoji: string }) => {
        setNewMessage(prev => prev + emojiObject.emoji);
    };

    // Filter users
    const filteredUsers = staffUsers.filter(u =>
        u.id !== user?.id &&
        (u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="messaging-page messaging-container">
            {/* 1. Left Sidebar */}
            <div className="messaging-sidebar">
                {/* Header */}
                <div className="messaging-sidebar-header">
                    <div className="messaging-user-avatar">
                        {/* Placeholder Avatar */}
                        <Users size={24} color="#cfd8dc" />
                    </div>
                    <div className="messaging-header-icons">
                        <div className="messaging-icon-btn" title="Communities"><Users size={24} strokeWidth={1.5} /></div>
                        <div className="messaging-icon-btn" title="Status"><div className="messaging-status-icon"><div className="messaging-status-icon-inner"></div></div></div>
                        <div className="messaging-icon-btn" title="New Chat" onClick={() => setShowNewChat(true)}><MessageSquare size={22} strokeWidth={1.5} /></div>
                        <div className="messaging-icon-btn" title="Menu"><MoreVertical size={22} strokeWidth={1.5} /></div>
                    </div>
                </div>

                {/* Search */}
                <div className="messaging-search-bar">
                    <div className="messaging-search-input-wrapper">
                        <Search size={18} />
                        <input
                            placeholder="Search or start new chat"
                            className="messaging-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="messaging-chat-list">
                    {loading ? (
                        <div className="messaging-loading">Loading chats...</div>
                    ) : rooms.length === 0 ? (
                        <div className="messaging-no-chats">No chats. Click the icon to start a new chat.</div>
                    ) : (
                        rooms.map(room => (
                            <div
                                key={room.id}
                                onClick={() => selectRoom(room)}
                                className={`messaging-chat-item ${selectedRoom?.id === room.id ? 'messaging-chat-item-selected' : ''}`}
                            >
                                <div className="messaging-user-avatar messaging-user-avatar-large">
                                    {room.is_group ? <Users size={24} /> : room.display_name?.[0]?.toUpperCase()}
                                </div>
                                <div className="messaging-chat-info">
                                    <div className="messaging-chat-row1">
                                        <div className="messaging-chat-name">{room.display_name}</div>
                                        {room.last_message && (
                                            <div className="messaging-chat-time">
                                                {new Date(room.last_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="messaging-chat-row2">
                                        <div className="messaging-chat-preview">
                                            {room.last_message ? (
                                                <>
                                                    {user?.id !== room.last_message.sender_id && <span>{room.last_message.sender_name}: </span>}
                                                    {room.last_message.content}
                                                </>
                                            ) : <i>No messages yet</i>}
                                        </div>
                                        {room.unread_count > 0 && (
                                            <div className="messaging-unread-badge">{room.unread_count}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 2. Right Chat Area */}
            {selectedRoom ? (
                <div className="messaging-chat-area">
                    {/* Header */}
                    <div className="messaging-chat-header">
                        <div className="messaging-chat-header-info">
                            <div className="messaging-user-avatar messaging-avatar-margin-right">
                                {selectedRoom.is_group ? <Users size={22} /> : selectedRoom.display_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div className="messaging-chat-header-text">{selectedRoom.display_name}</div>
                                <div className="messaging-chat-header-status">
                                    {wsConnected ? 'online' : 'connecting...'}
                                </div>
                            </div>
                        </div>
                        <div className="messaging-header-icons">
                            <div className="messaging-icon-btn"><Search size={22} strokeWidth={1.5} /></div>
                            <div className="messaging-icon-btn"><MoreVertical size={22} strokeWidth={1.5} /></div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="messaging-chat-bg"></div>
                    <div className="messaging-messages-wrapper">
                        {messages.map((msg, i) => {
                            const isOwn = msg.sender === user?.id || msg.is_own;
                            return (
                                <div key={i} className="messaging-message-row">
                                    <div className={`messaging-message-bubble ${isOwn ? 'messaging-message-outgoing' : 'messaging-message-incoming'}`}>
                                        {/* Sender Name in groups */}
                                        {!isOwn && selectedRoom.is_group && (
                                            <div className="messaging-message-sender-name">
                                                {msg.sender_name}
                                            </div>
                                        )}
                                        {/* Content */}
                                        <span>{msg.content}</span>
                                        {/* Meta (Time + Checks) */}
                                        <div className="messaging-msg-meta">
                                            <span className="messaging-msg-time">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isOwn && (
                                                <span className={msg.is_read ? 'messaging-msg-check-read' : 'messaging-msg-check'}>
                                                    {msg.is_read ? <CheckCheck size={16} /> : <Check size={16} />}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="messaging-input-area">
                        <div className="messaging-icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                            <Smile size={26} />
                        </div>
                        {showEmojiPicker && (
                            <div ref={emojiPickerRef} className="messaging-emoji-picker-wrapper">
                                <EmojiPicker theme={Theme.DARK} onEmojiClick={onEmojiClick} />
                            </div>
                        )}
                        <div className="messaging-icon-btn">
                            <Plus size={26} className="messaging-icon-rotate-0" />
                        </div>
                        <div className="messaging-input-field-wrapper">
                            <input
                                className="messaging-input-field"
                                placeholder="Type a message"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage(e)}
                            />
                        </div>
                        <div className="messaging-icon-btn" onClick={newMessage.trim() ? sendMessage : undefined}>
                            {newMessage.trim() ? (
                                <Send size={26} />
                            ) : (
                                <Mic size={26} />
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div className="messaging-empty-state">
                    <div className="messaging-wrapper-margin-bottom"> {/** Illustration placeholder */}
                        <div className="messaging-empty-icon-wrapper">
                            <Phone size={80} />
                        </div>
                    </div>
                    <h1 className="messaging-empty-title">WhatsApp for Windows</h1>
                    <p className="messaging-empty-text">
                        Send and receive messages without keeping your phone online.<br />
                        Use WhatsApp on up to 4 linked devices and 1 phone.
                    </p>
                </div>
            )}

            {/* New Chat Modal */}
            {showNewChat && (
                <div className="messaging-modal-mask" onClick={() => setShowNewChat(false)}>
                    <div className="messaging-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="messaging-modal-header">
                            <div className="messaging-modal-header-content">
                                <ArrowLeft size={24} className="messaging-modal-back-icon" onClick={() => setShowNewChat(false)} />
                                <div className="messaging-modal-title">New Chat</div>
                            </div>
                        </div>
                        <div className="messaging-search-bar">
                            <div className="messaging-search-input-wrapper">
                                <Search size={18} />
                                <input className="messaging-search-input" autoFocus placeholder="Search contact" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                        <div className="messaging-modal-user-list">
                            {filteredUsers.map(u => (
                                <div key={u.id} className="messaging-modal-user-item" onClick={() => createRoom([u.id])}>
                                    <div className="messaging-user-avatar messaging-user-avatar-large">
                                        {u.first_name?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="messaging-modal-user-info">
                                        <div className="messaging-modal-user-name">{u.first_name} {u.last_name}</div>
                                        <div className="messaging-modal-user-email">{u.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
