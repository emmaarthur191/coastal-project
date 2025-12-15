import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import {
    Send, Plus, Search, Users, MessageSquare, ArrowLeft,
    MoreVertical, Phone, Paperclip, Mic, Smile,
    Check, CheckCheck, Menu, X
} from 'lucide-react';

// API base URL
const API_BASE_URL = '/api/';

// Helper to get CSRF token from cookies
const getCsrfToken = () => {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
};

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
            const response = await fetch(`${API_BASE_URL}chat/rooms/`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
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
            const response = await fetch(`${API_BASE_URL}users/staff/`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setStaffUsers(data.results || data || []);
            }
        } catch (error) {
            console.error('Failed to load staff:', error);
        }
    };

    const loadMessages = async (roomId) => {
        try {
            const response = await fetch(`${API_BASE_URL}chat/rooms/${roomId}/messages/`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
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
            if (csrfToken) headers['X-CSRFToken'] = csrfToken;

            const response = await fetch(`${API_BASE_URL}chat/rooms/create/`, {
                method: 'POST',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({ member_ids: memberIds, name, is_group: isGroup })
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

    // WebSocket
    const connectWebSocket = useCallback((roomId) => {
        if (socketRef.current) socketRef.current.close();

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/chat/${roomId}/`;
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
            // Reconnect logic would go here
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
                // REST Fallback (with CSRF)
                const csrfToken = getCsrfToken();
                const headers = { 'Content-Type': 'application/json' };
                if (csrfToken) headers['X-CSRFToken'] = csrfToken;

                await fetch(`${API_BASE_URL}chat/rooms/${selectedRoom.id}/messages/send/`, {
                    method: 'POST',
                    headers,
                    credentials: 'include',
                    body: JSON.stringify({ content })
                });
                loadMessages(selectedRoom.id);
            }
        } catch (error) {
            console.error('Send failed:', error);
        } finally {
            setSending(false);
        }
    };

    // Global styles for scrollbar (injected via useEffect)
    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = `
            ::-webkit-scrollbar { width: 6px !important; height: 6px !important; }
            ::-webkit-scrollbar-track { background: transparent !important; }
            ::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2) !important; }
        `;
        document.head.appendChild(styleSheet);
        return () => document.head.removeChild(styleSheet);
    }, []);

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.emoji);
    };

    // Filter users
    const filteredUsers = staffUsers.filter(u =>
        u.id !== user?.id &&
        (u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // --- STYLES (WhatsApp Dark Mode) ---
    const colors = {
        bgDeep: '#0b141a',    // Main app background
        bgSidebar: '#111b21', // Sidebar list background
        header: '#202c33',    // Headers (Sidebar & Chat)
        incoming: '#202c33',  // Incoming message bubble
        outgoing: '#005c4b',  // Outgoing message bubble
        inputBar: '#202c33',  // Input bar background
        inputField: '#2a3942',// Input field background
        primary: '#00a884',   // WhatsApp Green (Accents)
        textMain: '#e9edef',  // Primary text
        textSec: '#8696a0',   // Secondary text (time, status)
        divider: '#222d34',   // Borders
        blueTick: '#53bdeb'   // Read receipt
    };

    const styles = {
        container: { display: 'flex', height: '100vh', background: colors.bgDeep, color: colors.textMain, overflow: 'hidden', fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif' },

        // Left Sidebar
        sidebar: { width: '30%', minWidth: '320px', maxWidth: '420px', display: 'flex', flexDirection: 'column', background: colors.bgSidebar, borderRight: `1px solid ${colors.divider}` },
        sidebarHeader: { height: '60px', padding: '10px 16px', background: colors.header, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRight: `1px solid ${colors.divider}` },
        userAvatar: { width: '40px', height: '40px', borderRadius: '50%', background: colors.textSec, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
        headerIcons: { display: 'flex', gap: '20px', color: colors.textSec },
        iconBtn: { cursor: 'pointer', display: 'flex', alignItems: 'center' },

        searchBar: { height: '49px', borderBottom: `1px solid ${colors.divider}`, padding: '7px 12px', display: 'flex', alignItems: 'center' },
        searchInputWrapper: { background: colors.header, borderRadius: '8px', height: '35px', width: '100%', display: 'flex', alignItems: 'center', padding: '0 12px' },
        searchInput: { background: 'transparent', border: 'none', color: colors.textMain, width: '100%', marginLeft: '12px', outline: 'none', fontSize: '14px' },

        chatList: { flex: 1, overflowY: 'auto' },
        chatItem: { height: '72px', display: 'flex', alignItems: 'center', padding: '0 15px', cursor: 'pointer', borderBottom: `1px solid ${colors.divider}` },
        chatItemHover: { background: '#202c33' },
        chatInfo: { flex: 1, marginLeft: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', borderBottom: `1px solid ${colors.divider}00` }, // using 00 for transparent if needed
        chatRow1: { display: 'flex', justifyContent: 'space-between', marginBottom: '3px' },
        chatRow2: { display: 'flex', justifyContent: 'space-between' },
        chatName: { fontSize: '17px', fontWeight: '400', color: colors.textMain },
        chatTime: { fontSize: '12px', color: colors.textSec },
        chatPreview: { fontSize: '14px', color: colors.textSec, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' },
        unreadBadge: { background: colors.primary, color: '#111b21', borderRadius: '50%', minWidth: '20px', height: '20px', padding: '0 4px', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center' },

        // Right Chat Area
        chatArea: { flex: 1, display: 'flex', flexDirection: 'column', background: colors.bgDeep, position: 'relative' },
        chatHeader: { height: '60px', padding: '10px 16px', background: colors.header, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
        chatBg: {
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.06,
            backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' // Generic doodle pattern
        },
        messagesWrapper: { flex: 1, overflowY: 'auto', padding: '20px 60px', zIndex: 1, position: 'relative', display: 'flex', flexDirection: 'column' },

        messageRow: { display: 'flex', marginBottom: '2px', width: '100%' },
        messageBubble: {
            maxWidth: '65%', padding: '6px 7px 8px 9px', borderRadius: '7.5px', fontSize: '14.2px', lineHeight: '19px', position: 'relative',
            boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)'
        },
        incoming: { background: colors.incoming, borderTopLeftRadius: 0, alignSelf: 'flex-start' },
        outgoing: { background: colors.outgoing, borderTopRightRadius: 0, alignSelf: 'flex-end', marginLeft: 'auto' },

        msgMeta: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '3px', marginTop: '-4px', float: 'right', paddingLeft: '7px', paddingTop: '6px' },
        msgTime: { fontSize: '11px', color: 'rgba(255,255,255,0.6)' },

        inputArea: { minHeight: '62px', background: colors.inputBar, padding: '5px 16px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10 },
        inputFieldWrapper: { flex: 1, background: colors.inputField, borderRadius: '8px', padding: '9px 12px', display: 'flex', alignItems: 'center' },
        inputField: { background: 'transparent', border: 'none', color: colors.textMain, width: '100%', outline: 'none', fontSize: '15px', resize: 'none', height: '22px', maxHeight: '100px' },

        // Empty State
        emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: colors.divider, borderBottom: `6px solid ${colors.primary}`, color: colors.textSec, textAlign: 'center' },
        emptyImg: { width: '300px', marginBottom: '30px', opacity: 0.6 }, // Need an illustration

        // Modal
        modalMask: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,20,26,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
        modalBox: { width: '400px', height: '80%', background: colors.bgSidebar, borderRadius: '3px', display: 'flex', flexDirection: 'column', boxShadow: '0 17px 50px 0 rgba(0,0,0,0.19)' },
    };

    return (
        <div style={styles.container}>
            {/* 1. Left Sidebar */}
            <div style={styles.sidebar}>
                {/* Header */}
                <div style={styles.sidebarHeader}>
                    <div style={styles.userAvatar}>
                        {/* Placeholder Avatar */}
                        <Users size={24} color="#cfd8dc" />
                    </div>
                    <div style={styles.headerIcons}>
                        <div style={styles.iconBtn} title="Communities"><Users size={24} strokeWidth={1.5} /></div>
                        <div style={styles.iconBtn} title="Status"><div style={{ border: '2px solid', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 14, height: 14, border: '2px solid', borderRadius: '50%' }}></div></div></div>
                        <div style={styles.iconBtn} title="New Chat" onClick={() => setShowNewChat(true)}><MessageSquare size={22} strokeWidth={1.5} /></div>
                        <div style={styles.iconBtn} title="Menu"><MoreVertical size={22} strokeWidth={1.5} /></div>
                    </div>
                </div>

                {/* Search */}
                <div style={styles.searchBar}>
                    <div style={styles.searchInputWrapper}>
                        <Search size={18} color={colors.textSec} style={{ minWidth: '18px' }} />
                        <input
                            placeholder="Search or start new chat"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div style={styles.chatList}>
                    {loading ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: colors.textSec }}>Loading chats...</div>
                    ) : rooms.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: colors.textSec }}>No chats. Click the icon to start a new chat.</div>
                    ) : (
                        rooms.map(room => (
                            <div
                                key={room.id}
                                onClick={() => selectRoom(room)}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#202c33'}
                                onMouseLeave={(e) => e.currentTarget.style.background = selectedRoom?.id === room.id ? '#2a3942' : 'transparent'}
                                style={{
                                    ...styles.chatItem,
                                    background: selectedRoom?.id === room.id ? '#2a3942' : 'transparent'
                                }}
                            >
                                <div style={{ ...styles.userAvatar, width: '49px', height: '49px', fontSize: '20px' }}>
                                    {room.is_group ? <Users size={24} /> : room.display_name?.[0]?.toUpperCase()}
                                </div>
                                <div style={styles.chatInfo}>
                                    <div style={styles.chatRow1}>
                                        <div style={styles.chatName}>{room.display_name}</div>
                                        {room.last_message && (
                                            <div style={styles.chatTime}>
                                                {new Date(room.last_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                    <div style={styles.chatRow2}>
                                        <div style={styles.chatPreview}>
                                            {room.last_message ? (
                                                <>
                                                    {user?.id !== room.last_message.sender_id && <span>{room.last_message.sender_name}: </span>}
                                                    {room.last_message.content}
                                                </>
                                            ) : <i>No messages yet</i>}
                                        </div>
                                        {room.unread_count > 0 && (
                                            <div style={styles.unreadBadge}>{room.unread_count}</div>
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
                <div style={styles.chatArea}>
                    {/* Header */}
                    <div style={styles.chatHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <div style={{ ...styles.userAvatar, marginRight: '15px' }}>
                                {selectedRoom.is_group ? <Users size={22} /> : selectedRoom.display_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: '16px', color: colors.textMain }}>{selectedRoom.display_name}</div>
                                <div style={{ fontSize: '13px', color: colors.textSec }}>
                                    {wsConnected ? 'online' : 'connecting...'}
                                </div>
                            </div>
                        </div>
                        <div style={styles.headerIcons}>
                            <div style={styles.iconBtn}><Search size={22} strokeWidth={1.5} /></div>
                            <div style={styles.iconBtn}><MoreVertical size={22} strokeWidth={1.5} /></div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={styles.chatBg}></div>
                    <div style={styles.messagesWrapper}>
                        {messages.map((msg, i) => {
                            const isOwn = msg.sender === user?.id || msg.is_own;
                            return (
                                <div key={i} style={styles.messageRow}>
                                    <div style={{
                                        ...styles.messageBubble,
                                        ...(isOwn ? styles.outgoing : styles.incoming)
                                    }}>
                                        {/* Sender Name in groups */}
                                        {!isOwn && selectedRoom.is_group && (
                                            <div style={{ color: colors.primary, fontSize: '13px', fontWeight: '500', marginBottom: '3px' }}>
                                                {msg.sender_name}
                                            </div>
                                        )}
                                        {/* Content */}
                                        <span>{msg.content}</span>
                                        {/* Meta (Time + Checks) */}
                                        <div style={styles.msgMeta}>
                                            <span style={styles.msgTime}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isOwn && (
                                                <span style={{ color: msg.is_read ? colors.blueTick : colors.textSec }}>
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
                    <div style={styles.inputArea}>
                        <div style={styles.iconBtn} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                            <Smile size={26} color={colors.textSec} />
                        </div>
                        {showEmojiPicker && (
                            <div ref={emojiPickerRef} style={{ position: 'absolute', bottom: '70px', left: '20px', zIndex: 100 }}>
                                <EmojiPicker theme="dark" onEmojiClick={onEmojiClick} />
                            </div>
                        )}
                        <div style={styles.iconBtn}>
                            <Plus size={26} color={colors.textSec} style={{ transform: 'rotate(0deg)' }} />
                        </div>
                        <div style={styles.inputFieldWrapper}>
                            <input
                                style={styles.inputField}
                                placeholder="Type a message"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage(e)}
                            />
                        </div>
                        <div style={styles.iconBtn} onClick={newMessage.trim() ? sendMessage : null}>
                            {newMessage.trim() ? (
                                <Send size={26} color={colors.textSec} />
                            ) : (
                                <Mic size={26} color={colors.textSec} />
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div style={styles.emptyState}>
                    <div style={{ marginBottom: '20px' }}> {/** Illustration placeholder */}
                        <div style={{ width: '200px', height: '200px', borderRadius: '50%', background: '#2a3942', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Phone size={80} color={colors.textSec} />
                        </div>
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: '300', marginBottom: '15px', color: colors.textMain }}>WhatsApp for Windows</h1>
                    <p style={{ fontSize: '14px', color: colors.textSec, maxWidth: '450px', lineHeight: '20px' }}>
                        Send and receive messages without keeping your phone online.<br />
                        Use WhatsApp on up to 4 linked devices and 1 phone.
                    </p>
                </div>
            )}

            {/* New Chat Modal */}
            {showNewChat && (
                <div style={styles.modalMask} onClick={() => setShowNewChat(false)}>
                    <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ ...styles.sidebarHeader, background: colors.header, color: colors.textMain }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <ArrowLeft size={24} style={{ marginRight: '15px', cursor: 'pointer' }} onClick={() => setShowNewChat(false)} />
                                <div style={{ fontSize: '19px', fontWeight: '500' }}>New Chat</div>
                            </div>
                        </div>
                        <div style={styles.searchBar}>
                            <div style={styles.searchInputWrapper}>
                                <Search size={18} color={colors.textSec} />
                                <input style={styles.searchInput} autoFocus placeholder="Search contact" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                        <div style={{ ...styles.chatList, padding: '10px 0' }}>
                            {filteredUsers.map(u => (
                                <div key={u.id} style={styles.chatItem} onClick={() => createRoom([u.id])} onMouseEnter={e => e.currentTarget.style.background = '#202c33'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <div style={{ ...styles.userAvatar, width: '49px', height: '49px', fontSize: '20px' }}>
                                        {u.first_name?.[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ marginLeft: '15px' }}>
                                        <div style={{ color: colors.textMain, fontSize: '17px' }}>{u.first_name} {u.last_name}</div>
                                        <div style={{ color: colors.textSec, fontSize: '14px' }}>{u.email}</div>
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


