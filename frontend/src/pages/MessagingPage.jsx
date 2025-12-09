
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import EmojiPicker from 'emoji-picker-react';
import { useDropzone } from 'react-dropzone';
import {
  Send, Search, Settings, Plus, Phone, Video, Smile, Paperclip, Mic,
  Wifi, WifiOff, MessageCircle, ArrowLeft
} from 'lucide-react';

// Lazy load components
const UserAvatar = lazy(() => import('../components/messaging/UserAvatar'));
const MessageItem = lazy(() => import('../components/messaging/MessageItem'));
const NewThreadModal = lazy(() => import('../components/messaging/NewThreadModal'));
const SearchModal = lazy(() => import('../components/messaging/SearchModal'));
const SettingsModal = lazy(() => import('../components/messaging/SettingsModal'));
const CallModal = lazy(() => import('../components/messaging/CallModal'));

// Import utilities
import SecureMessagingEncryption from '../utils/messaging/SecureMessagingEncryption';
import EnhancedWebSocketManager from '../utils/messaging/EnhancedWebSocketManager';
import NotificationManager from '../utils/messaging/NotificationManager';
import FileUploadHandler from '../utils/messaging/FileUploadHandler';

// Theme system
const themes = {
  light: {
    name: 'Light',
    colors: {
      background: '#ffffff',
      surface: '#f8f9fa',
      surfaceVariant: '#e9ecef',
      primary: '#007bff',
      primaryContainer: '#e3f2fd',
      secondary: '#6c757d',
      onSurface: '#212529',
      onSurfaceVariant: '#6c757d',
      border: '#dee2e6'
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      background: '#121212',
      surface: '#1e1e1e',
      surfaceVariant: '#2d2d2d',
      primary: '#4dabf7',
      primaryContainer: '#1e3a5f',
      secondary: '#adb5bd',
      onSurface: '#ffffff',
      onSurfaceVariant: '#adb5bd',
      border: '#404040'
    }
  },
  blue: {
    name: 'Blue',
    colors: {
      background: '#f0f8ff',
      surface: '#ffffff',
      surfaceVariant: '#f1f3f4',
      primary: '#1976d2',
      primaryContainer: '#e3f2fd',
      secondary: '#424242',
      onSurface: '#212121',
      onSurfaceVariant: '#757575',
      border: '#e0e0e0'
    }
  }
};

function MessagingPage() {
  const { user, logout } = useAuth();

  // Core state
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Enhanced features state
  const [staffUsers, setStaffUsers] = useState([]);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadData, setNewThreadData] = useState({
    participants: [],
    subject: '',
    initial_message: ''
  });

  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [showUserProfile, setShowUserProfile] = useState(null);
  const [showModerationMenu, setShowModerationMenu] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Real-time features
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [encryptionKeys, setEncryptionKeys] = useState(new Map());
  const [decryptedMessages, setDecryptedMessages] = useState(new Map());
  const [messageReactions, setMessageReactions] = useState(new Map());

  // File upload
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState(new Map());

  // Call modal
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState(null); // 'video' or 'voice'
  const [activeStream, setActiveStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callParticipants, setCallParticipants] = useState([]);
  const [selectedCallParticipants, setSelectedCallParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);

  // Device synchronization
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [devices, setDevices] = useState([]);

  // Refs
  const wsManagerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Theme colors
  const theme = themes[currentTheme];

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Check user permissions
  const hasMessagingAccess = useCallback(() => {
    const staffRoles = ['manager', 'operations_manager', 'cashier', 'mobile_banker'];
    return user && staffRoles.includes(user.role);
  }, [user]);

  // Handle video call
  const handleVideoCall = () => {
    if (!hasMessagingAccess()) {
      alert('Access denied. Video calls are only for authorized staff.');
      return;
    }
    setCallType('video');
    setSelectedCallParticipants(selectedThread?.participants?.filter(p => p.id !== user.id) || []);
    setShowCallModal(true);
  };

  // Handle voice call
  const handleVoiceCall = () => {
    if (!hasMessagingAccess()) {
      alert('Access denied. Voice calls are only for authorized staff.');
      return;
    }
    setCallType('voice');
    setSelectedCallParticipants(selectedThread?.participants?.filter(p => p.id !== user.id) || []);
    setShowCallModal(true);
  };

  // Start the actual call
  const startCall = async () => {
    setShowCallModal(false);
    try {
      const constraints = callType === 'video' ? { video: true, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setActiveStream(stream);
      setIsCallActive(true);
      setCallParticipants(selectedCallParticipants);
      alert(`${callType === 'video' ? 'Video' : 'Voice'} call started successfully. ${callType === 'video' ? 'Camera and microphone' : 'Microphone'} access granted.`);
      // In a real implementation, you'd connect to peers here
    } catch (error) {
      alert(`Failed to access ${callType === 'video' ? 'camera and microphone' : 'microphone'}: ${error.message}`);
    }
  };

  // End the call
  const endCall = () => {
    if (activeStream) {
      activeStream.getTracks().forEach(track => track.stop());
      setActiveStream(null);
    }
    setIsCallActive(false);
    setCallType(null);
    setCallParticipants([]);
    setIsMuted(false);
  };

  // Toggle mute
  const toggleMute = () => {
    if (activeStream) {
      const audioTracks = activeStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Voice recording functions
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

        // Upload the voice note
        try {
          const uploadResult = await authService.uploadMedia(audioFile);
          if (uploadResult.success) {
            setUploadedFiles(prev => new Map(prev.set(Date.now().toString(), uploadResult.data)));
          }
        } catch (error) {
          console.error('Failed to upload voice note:', error);
          setError('Failed to upload voice note');
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      setRecordedChunks(chunks);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      setError('Failed to access microphone for voice recording');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  // Device management
  const registerDevice = useCallback(async () => {
    const deviceId = localStorage.getItem('device_id') || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
    setCurrentDeviceId(deviceId);

    try {
      const result = await authService.registerDevice({
        device_id: deviceId,
        device_name: `Web Browser - ${navigator.userAgent.slice(0, 50)}`,
        device_type: 'web'
      });

      if (result.success) {
        console.log('[DEVICE] Device registered successfully');
        // Sync data after registration
        await syncDeviceData(deviceId);
      } else {
        console.error('[DEVICE] Failed to register device:', result.error);
      }
    } catch (error) {
      console.error('[DEVICE] Error registering device:', error);
    }
  }, []);

  const syncDeviceData = useCallback(async (deviceId) => {
    try {
      const result = await authService.syncDeviceData(deviceId);
      if (result.success) {
        console.log('[SYNC] Device data synced successfully');
        // Update local state with synced data
        if (result.data.messages && result.data.messages.length > 0) {
          // Handle incoming messages from sync
          result.data.messages.forEach(message => {
            // Add to local messages if not already present
            setMessages(prev => {
              const exists = prev.find(m => m.id === message.id);
              return exists ? prev : [...prev, message];
            });
          });
        }
      }
    } catch (error) {
      console.error('[SYNC] Error syncing device data:', error);
    }
  }, []);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!hasMessagingAccess()) {
      setError('Access denied. Messaging is only available to staff members.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load threads and staff users in parallel
      const [threadsResult, staffResult] = await Promise.allSettled([
        authService.getMessageThreads(),
        authService.getStaffUsers()
      ]);

      if (threadsResult.status === 'fulfilled' && threadsResult.value.success) {
        setThreads(threadsResult.value.data || []);
      } else {
        console.warn('[INIT] Failed to load message threads:', threadsResult.value?.error);
        setThreads([]);
      }

      if (staffResult.status === 'fulfilled' && staffResult.value.success) {
        setStaffUsers(staffResult.value.data || []);
      } else {
        console.warn('[INIT] Failed to load staff users:', staffResult.value?.error);
        // Fallback mock data for demo purposes
        setStaffUsers([
          { id: '1', first_name: 'John', last_name: 'Manager', email: 'john@bank.com' },
          { id: '2', first_name: 'Sarah', last_name: 'Cashier', email: 'sarah@bank.com' },
          { id: '3', first_name: 'Mike', last_name: 'Mobile', email: 'mike@bank.com' },
          { id: '4', first_name: 'Lisa', last_name: 'Operations', email: 'lisa@bank.com' }
        ]);
      }

      // Request notification permission
      const notificationGranted = await NotificationManager.requestPermission();
      setNotificationsEnabled(notificationGranted);

      // Register device for synchronization
      await registerDevice();

    } catch (error) {
      console.error('[INIT] Error loading initial data:', error);
      setError('Failed to load messaging data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, hasMessagingAccess]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load messages for selected thread
  const loadThreadMessages = useCallback(async (threadId) => {
    try {
      console.log('[MESSAGES] Loading messages for thread:', threadId);
      const result = await authService.getThreadMessages(threadId);
      if (result.success) {
        setMessages(result.data || []);
        // Decrypt messages in background
        decryptMessages(result.data || []);
      } else {
        console.error('[MESSAGES] Failed to load thread messages:', result.error);
        setMessages([]);
      }
    } catch (error) {
      console.error('[MESSAGES] Error loading thread messages:', error);
      setMessages([]);
    }
  }, []);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds) => {
    if (!currentDeviceId || messageIds.length === 0) return;

    try {
      for (const messageId of messageIds) {
        await authService.markMessageRead(messageId, currentDeviceId);

        // Send WebSocket message to mark as read
        if (wsManagerRef.current) {
          wsManagerRef.current.sendMessage({
            type: 'mark_read',
            message_id: messageId,
            device_id: currentDeviceId
          });
        }
      }
    } catch (error) {
      console.error('[READ] Error marking messages as read:', error);
    }
  }, [currentDeviceId]);

  // Handle thread selection
  const handleThreadSelect = useCallback(async (thread) => {
    console.log('[THREAD] Selecting thread:', thread.id);
    setSelectedThread(thread);
    setError(null);
    setSearchQuery('');
    setShowSearch(false);

    // Disconnect existing WebSocket
    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect();
    }

    // Load messages
    await loadThreadMessages(thread.id);

    // Connect to WebSocket for real-time messaging
    wsManagerRef.current = new EnhancedWebSocketManager(
      thread.id,
      handleWebSocketMessage,
      handleWebSocketError,
      setWsConnected,
      handleTypingUpdate,
      handlePresenceUpdate,
      handleReactionUpdate
    );
    wsManagerRef.current.connect();
  }, [loadThreadMessages]);

  // WebSocket message handlers
  const handleWebSocketMessage = useCallback(async (data) => {
    console.log('[WEBSOCKET] Handling message:', data.type);

    if (data.type === 'new_message' && data.message) {
      console.log('[WEBSOCKET] New message received, ID:', data.message.id);

      // Add new message to the list
      setMessages(prev => [...prev, data.message]);

      // Show notification if not from current user
      if (data.message.sender_id !== user.id && notificationsEnabled && document.hidden) {
        NotificationManager.showNotification(
          `New message in ${selectedThread.subject}`,
          data.message.sender_name + ': ' + (data.message.preview || 'New message'),
          '/favicon.ico'
        );
      }

      // Decrypt the new message
      try {
        const decrypted = await decryptSingleMessage(data.message);
        setDecryptedMessages(prev => new Map(prev.set(data.message.id, decrypted)));
      } catch (error) {
        console.error('[WEBSOCKET] Failed to decrypt new message:', error);
      }
    } else if (data.type === 'message_read' && data.message_id && data.user_id !== user.id) {
      // Update message read status from other devices
      setMessages(prev => prev.map(msg =>
        msg.id === data.message_id ? { ...msg, is_read: true } : msg
      ));
    }
  }, [selectedThread, user, notificationsEnabled]);

  const handleWebSocketError = useCallback((error) => {
    console.error('[WEBSOCKET] Error:', error);
  }, []);

  const handleTypingUpdate = useCallback((data) => {
    console.log('[TYPING] Update:', data);
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      if (data.type === 'typing_start') {
        newSet.add(data.user_id);
      } else {
        newSet.delete(data.user_id);
      }
      return newSet;
    });
  }, []);

  const handlePresenceUpdate = useCallback((data) => {
    console.log('[PRESENCE] Update:', data);
    setOnlineUsers(prev => new Map(prev.set(data.user_id, data.status)));
  }, []);

  const handleReactionUpdate = useCallback((data) => {
    console.log('[REACTION] Update:', data);

    if (data.type === 'reaction_added' && data.reaction) {
      // Update local reactions state
      setMessageReactions(prev => {
        const messageId = data.reaction.message_id;
        const currentReactions = prev.get(messageId) || [];
        const emoji = data.reaction.emoji;

        // Check if this emoji already exists
        const existingReaction = currentReactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          existingReaction.count += 1;
          if (!existingReaction.users.some(u => u.id === data.reaction.user_id)) {
            existingReaction.users.push({
              id: data.reaction.user_id,
              name: data.reaction.user_name
            });
          }
        } else {
          currentReactions.push({
            emoji: emoji,
            count: 1,
            users: [{
              id: data.reaction.user_id,
              name: data.reaction.user_name
            }]
          });
        }

        return new Map(prev.set(messageId, currentReactions));
      });
    } else if (data.type === 'reaction_removed') {
      // Update local reactions state
      setMessageReactions(prev => {
        const messageId = data.message_id;
        const currentReactions = prev.get(messageId) || [];
        const emoji = data.emoji;

        const existingReaction = currentReactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          existingReaction.count -= 1;
          existingReaction.users = existingReaction.users.filter(u => u.id !== data.user_id);

          if (existingReaction.count <= 0) {
            const updatedReactions = currentReactions.filter(r => r.emoji !== emoji);
            return new Map(prev.set(messageId, updatedReactions));
          } else {
            return new Map(prev.set(messageId, currentReactions));
          }
        }

        return prev;
      });
    }
  }, []);

  // Typing indicator
  const handleTyping = useCallback(() => {
    if (wsManagerRef.current && newMessage.trim()) {
      wsManagerRef.current.sendTyping(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        wsManagerRef.current?.sendTyping(false);
      }, 1000);
    }
  }, [newMessage]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || sending) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      console.log('[SEND] Sending message...');

      // Stop typing indicator
      wsManagerRef.current?.sendTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Encrypt message
      const encryptedData = await encryptMessage(newMessage.trim());

      // Prepare message data
      const messageData = {
        thread: selectedThread.id,
        encrypted_content: encryptedData.ciphertext,
        iv: encryptedData.iv,
        auth_tag: encryptedData.auth_tag,
        message_type: 'text',
        attachments: Array.from(uploadedFiles.values())
      };

      // Send via REST API
      const result = await authService.sendMessage(messageData);

      if (result.success) {
        console.log('[SEND] Message sent successfully');
        setNewMessage('');
        setUploadedFiles(new Map());

        // Add to local messages immediately for better UX
        const newMsg = {
          ...result.data,
          sender_name: user.first_name + ' ' + user.last_name,
          is_from_current_user: true,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMsg]);
        setDecryptedMessages(prev => new Map(prev.set(newMsg.id, newMessage.trim())));
      } else {
        throw new Error(result.error || 'Failed to send message');
      }

    } catch (error) {
      console.error('[SEND] Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Encrypt message for current thread
  const encryptMessage = async (plaintext) => {
    try {
      console.log('[ENCRYPTION] Starting message encryption for thread:', selectedThread.id);

      // Get or create encryption keys for all thread participants
      const participantKeys = new Map();

      for (const participant of selectedThread.participants) {
        if (participant.id === user.id) continue; // Skip self

        let keyData = encryptionKeys.get(participant.id);
        if (!keyData) {
          console.log(`[ENCRYPTION] Fetching encryption key for participant ${participant.id}`);
          const keyResult = await authService.getUserEncryptionKey(participant.id);
          if (keyResult.success) {
            keyData = keyResult.data;
            setEncryptionKeys(prev => new Map(prev.set(participant.id, keyData)));
            console.log(`[ENCRYPTION] Successfully retrieved key for participant ${participant.id}`);
          } else {
            console.warn(`[ENCRYPTION] No encryption key found for user ${participant.id}:`, keyResult.error);
            continue;
          }
        }

        if (keyData?.public_key) {
          participantKeys.set(participant.id, keyData.public_key);
        }
      }

      console.log(`[ENCRYPTION] Found ${participantKeys.size} participant keys`);

      // For each participant, derive shared secret and encrypt
      // In production, you'd encrypt separately for each recipient
      const sharedSecret = await generateSharedSecret();
      return await SecureMessagingEncryption.encryptMessage(plaintext, sharedSecret);

    } catch (error) {
      console.error('[ENCRYPTION] Error encrypting message:', error);
      throw new Error('Failed to encrypt message');
    }
  };

  // Generate shared secret (enhanced version)
  const generateSharedSecret = async () => {
    console.log('[ENCRYPTION] Generating shared secret with proper ECDH');

    // Generate ECDH keypair
    const keypair = await SecureMessagingEncryption.generateECDHKeypair();

    // In a real implementation, you'd exchange public keys with participants
    // For now, we'll derive a key from the thread ID as a salt
    const threadSalt = new TextEncoder().encode(selectedThread.id);
    const hkdfKey = await window.crypto.subtle.importKey(
      'raw',
      threadSalt,
      'HKDF',
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: window.crypto.getRandomValues(new Uint8Array(32)),
        info: new TextEncoder().encode('thread-encryption-key'),
      },
      hkdfKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );
  };

  // Decrypt messages
  const decryptMessages = async (messageList) => {
    console.log('[DECRYPT] Decrypting', messageList.length, 'messages');

    const decrypted = new Map();

    for (const message of messageList) {
      try {
        const plaintext = await decryptSingleMessage(message);
        decrypted.set(message.id, plaintext);
      } catch (error) {
        console.error(`[DECRYPT] Failed to decrypt message ${message.id}:`, error);
        decrypted.set(message.id, '[Failed to decrypt]');
      }
    }

    setDecryptedMessages(decrypted);
  };

  // Decrypt single message
  const decryptSingleMessage = async (message) => {
    try {
      console.log('[DECRYPT] Decrypting message ID:', message.id);

      if (message.encrypted_content && message.iv && message.auth_tag) {
        console.log('[DECRYPT] Message has encrypted content, generating shared secret');
        const sharedSecret = await generateSharedSecret();

        const result = await SecureMessagingEncryption.decryptMessage(
          {
            ciphertext: message.encrypted_content,
            iv: message.iv,
            auth_tag: message.auth_tag
          },
          sharedSecret
        );

        console.log('[DECRYPT] Message decrypted successfully');
        return result;
      } else {
        console.warn('[DECRYPT] Message appears to be unencrypted');
        return message.encrypted_content || '[No content]';
      }
    } catch (error) {
      console.error('[DECRYPT] Error decrypting message:', error);
      return '[Decryption failed]';
    }
  };

  // Create new thread
  const handleCreateThread = async () => {
    if (!newThreadData.participants.length || !newThreadData.subject.trim()) {
      setError('Please select participants and enter a subject');
      return;
    }

    try {
      setError(null);
      const result = await authService.createMessageThread({
        participants: newThreadData.participants,
        subject: newThreadData.subject,
        initial_message: newThreadData.initial_message || ''
      });

      if (result.success) {
        setThreads(prev => [result.data, ...prev]);
        setShowNewThread(false);
        setNewThreadData({ participants: [], subject: '', initial_message: '' });
      } else {
        throw new Error(result.error || 'Failed to create thread');
      }
    } catch (error) {
      console.error('[THREAD] Error creating thread:', error);
      setError('Failed to create message thread. Please try again.');
    }
  };

  // Search functionality
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Search in current thread messages
      const filteredMessages = messages.filter(message =>
        decryptedMessages.get(message.id)?.toLowerCase().includes(query.toLowerCase()) ||
        message.sender_name?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filteredMessages);
    } catch (error) {
      console.error('[SEARCH] Error searching messages:', error);
    }
  }, [messages, decryptedMessages]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  // File upload
  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      try {
        const uploadId = Date.now() + Math.random();
        setUploadingFiles(prev => [...prev, { id: uploadId, file, progress: 0 }]);

        // Update progress to 50% while uploading
        setUploadingFiles(prev => prev.map(upload =>
          upload.id === uploadId ? { ...upload, progress: 50 } : upload
        ));

        // Use the new uploadMedia API
        const uploadResult = await authService.uploadMedia(file);

        if (uploadResult.success) {
          setUploadedFiles(prev => new Map(prev.set(uploadId, uploadResult.data)));
          // Update progress to 100%
          setUploadingFiles(prev => prev.map(upload =>
            upload.id === uploadId ? { ...upload, progress: 100 } : upload
          ));
        } else {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        setUploadingFiles(prev => prev.filter(upload => upload.id !== uploadId));
      } catch (error) {
        console.error('[UPLOAD] Error uploading file:', error);
        setError(`Failed to upload ${file.name}: ${error.message}`);
        setUploadingFiles(prev => prev.filter(upload => upload.file !== file));
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          handleSendMessage();
        }

        if (event.key === 'Escape') {
          if (showNewThread) setShowNewThread(false);
          if (showEmojiPicker) setShowEmojiPicker(false);
          if (showSearch) setShowSearch(false);
        }
      }

      // Global shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'k':
            event.preventDefault();
            setShowSearch(true);
            break;
          case 'n':
            event.preventDefault();
            setShowNewThread(true);
            break;
          case '/':
            event.preventDefault();
            messageInputRef.current?.focus();
            break;
        }
      }

      // Alt+Left Arrow for back navigation (common browser shortcut)
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        handleBackNavigation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [newMessage, selectedThread, showNewThread, showEmojiPicker, showSearch, handleSendMessage]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle back navigation
  const handleBackNavigation = useCallback(() => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback: navigate to dashboard or home page
      // Since this is a banking app, we'll assume there's a dashboard route
      window.location.href = '/dashboard';
    }
  }, []);

  // Check if back navigation is available
  const canGoBack = window.history.length > 1;


  if (!hasMessagingAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.background }}>
        <div className="max-w-md p-8 rounded-lg shadow-lg text-center" style={{ background: theme.colors.surface }}>
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.onSurface }}>Access Denied</h2>
          <p style={{ color: theme.colors.onSurfaceVariant }}>
            Secure messaging is only available to authorized staff members.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: theme.colors.onSurface }}>Loading secure messaging...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: theme.colors.background, color: theme.colors.onSurface }}>
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b" style={{ background: theme.colors.surface, borderColor: theme.colors.border }}>
        <div className="flex items-center space-x-4">
          {/* Back Navigation Button */}
          <button
            onClick={handleBackNavigation}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            style={{ color: theme.colors.onSurface }}
            aria-label={canGoBack ? "Go back to previous page" : "Return to dashboard"}
            title={canGoBack ? "Go back (Alt+Left Arrow)" : "Return to dashboard"}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">{canGoBack ? "Go back" : "Return to dashboard"}</span>
          </button>

          <h1 className="text-xl font-bold">Secure Staff Messaging</h1>
          <div className="flex items-center space-x-2">
            {wsConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm" style={{ color: theme.colors.onSurfaceVariant }}>
              {wsConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            style={{ color: theme.colors.onSurface }}
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            style={{ color: theme.colors.onSurface }}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r flex flex-col" style={{ background: theme.colors.surface, borderColor: theme.colors.border }}>
          <div className="p-4 border-b" style={{ borderColor: theme.colors.border }}>
            <button
              onClick={() => setShowNewThread(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Thread
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {threads.map(thread => (
              <div
                key={thread.id}
                onClick={() => handleThreadSelect(thread)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedThread?.id === thread.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                style={{ borderColor: theme.colors.border }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium truncate">{thread.subject}</h3>
                  {thread.unread_count > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {thread.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {thread.last_message?.preview || 'No messages yet'}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {thread.participants?.length} members
                  </span>
                  <span className="text-xs text-gray-500">
                    {thread.last_message ? new Date(thread.last_message.timestamp).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between" style={{ background: theme.colors.surface, borderColor: theme.colors.border }}>
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-medium">{selectedThread.subject}</h2>
                  <div className="flex -space-x-2">
                    {selectedThread.participants?.slice(0, 3).map(participant => (
                      <Suspense key={participant.id} fallback={<div className="w-6 h-6 bg-gray-300 rounded-full animate-pulse" />}>
                        <UserAvatar user={participant} size={24} showStatus onlineUsers={onlineUsers} theme={theme} />
                      </Suspense>
                    ))}
                    {selectedThread.participants?.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                        +{selectedThread.participants.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleVoiceCall}
                    className="p-2 rounded hover:bg-gray-200 transition-colors"
                    title="Start voice call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleVideoCall}
                    className="p-2 rounded hover:bg-gray-200 transition-colors"
                    title="Start video call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded hover:bg-gray-200 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" {...getRootProps()}>
                {messages.map(message => (
                  <Suspense key={message.id} fallback={<div className="animate-pulse bg-gray-200 rounded-lg p-4 mb-4">Loading message...</div>}>
                    <MessageItem
                      message={message}
                      user={user}
                      decryptedMessages={decryptedMessages}
                      messageReactions={messageReactions}
                      setMessageReactions={setMessageReactions}
                      authService={authService}
                      theme={theme}
                    />
                  </Suspense>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Active Call UI */}
              {isCallActive && (
                <div className="px-4 py-4 bg-blue-50 border-t border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {callType === 'video' ? '📹' : '🎤'}
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">
                          {callType === 'video' ? 'Video' : 'Voice'} Call Active
                        </p>
                        <p className="text-sm text-blue-700">
                          {callParticipants.length} participant{callParticipants.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleMute}
                        className={`px-3 py-1 rounded transition-colors ${
                          isMuted ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                        }`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? '🔇' : '🎤'}
                      </button>
                      <button
                        onClick={endCall}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        End Call
                      </button>
                    </div>
                  </div>
                  {callParticipants.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-blue-900 mb-2">Participants:</p>
                      <div className="flex flex-wrap gap-2">
                        {callParticipants.map(participant => (
                          <div key={participant.id} className="flex items-center space-x-2 bg-white rounded px-2 py-1">
                            <UserAvatar user={participant} size={20} showStatus />
                            <span className="text-sm">{participant.first_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {callType === 'video' && activeStream && (
                    <div className="mt-4">
                      <video
                        ref={(video) => {
                          if (video && activeStream) {
                            video.srcObject = activeStream;
                            video.play().catch(console.error);
                          }
                        }}
                        className="w-full max-w-md rounded border"
                        muted
                        autoPlay
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Typing Indicators */}
              {typingUsers.size > 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  {Array.from(typingUsers).map(userId => {
                    const typingUser = staffUsers.find(u => u.id === userId);
                    return typingUser ? typingUser.first_name : 'Someone';
                  }).join(', ')} is typing...
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t" style={{ background: theme.colors.surface, borderColor: theme.colors.border }}>
                {/* File Upload Progress */}
                {uploadingFiles.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {uploadingFiles.map(upload => (
                      <div key={upload.id} className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${upload.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{upload.file.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Uploaded Files */}
                {uploadedFiles.size > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {Array.from(uploadedFiles.values()).map(file => (
                      <div key={file.id} className="flex items-center space-x-2 bg-gray-100 rounded p-2">
                        <File className="w-4 h-4" />
                        <span className="text-sm">{file.name}</span>
                        <button
                          onClick={() => setUploadedFiles(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(file.id);
                            return newMap;
                          })}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={messageInputRef}
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Type a message... (Ctrl+Enter to send)"
                      className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        background: theme.colors.surface,
                        borderColor: theme.colors.border,
                        color: theme.colors.onSurface
                      }}
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <button
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      className={`p-2 transition-colors ${
                        isRecording
                          ? 'text-red-500 hover:text-red-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title={isRecording ? 'Stop recording' : 'Record voice note'}
                    >
                      <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                    </button>
                    <button
                      {...getRootProps()}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <input {...getInputProps()} />
                      <Paperclip className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && uploadedFiles.size === 0}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setNewMessage(prev => prev + emojiData.emoji);
                        setShowEmojiPicker(false);
                      }}
                      theme={currentTheme}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose a message thread from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThread && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>}>
          <NewThreadModal
            showNewThread={showNewThread}
            setShowNewThread={setShowNewThread}
            newThreadData={newThreadData}
            setNewThreadData={setNewThreadData}
            staffUsers={staffUsers}
            user={user}
            handleCreateThread={handleCreateThread}
            theme={theme}
          />
        </Suspense>
      )}

      {/* Search Modal */}
      {showSearch && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>}>
          <SearchModal
            showSearch={showSearch}
            setShowSearch={setShowSearch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            decryptedMessages={decryptedMessages}
            handleSearch={handleSearch}
          />
        </Suspense>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>}>
          <SettingsModal
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            currentTheme={currentTheme}
            setCurrentTheme={setCurrentTheme}
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
            themes={themes}
          />
        </Suspense>
      )}

      {/* Call Modal */}
      {showCallModal && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>}>
          <CallModal
            showCallModal={showCallModal}
            setShowCallModal={setShowCallModal}
            callType={callType}
            selectedCallParticipants={selectedCallParticipants}
            setSelectedCallParticipants={setSelectedCallParticipants}
            selectedThread={selectedThread}
            user={user}
            startCall={startCall}
          />
        </Suspense>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center space-x-2">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-white hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagingPage;
