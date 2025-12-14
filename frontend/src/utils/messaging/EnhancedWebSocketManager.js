// Enhanced WebSocket Manager with typing indicators and presence
class EnhancedWebSocketManager {
  constructor(threadId, userId, onMessage, onError, onConnectionChange, onTyping, onPresence, onReaction, onSignal) {
    this.threadId = threadId;
    this.userId = userId;
    this.onMessage = onMessage;
    this.onError = onError;
    this.onConnectionChange = onConnectionChange;
    this.onTyping = onTyping;
    this.onPresence = onPresence;
    this.onPresence = onPresence;
    this.onReaction = onReaction;
    this.onSignal = onSignal;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.heartbeatInterval = null;
    this.typingTimeout = null;
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('accessToken');

    // Get WebSocket base URL from environment or fallback to localhost:8001
    const getWebSocketBaseUrl = () => {
      // PROD SAFEGUARD: If we are in production and ANY env var tries to point to localhost, ignore it.
      if (import.meta.env.PROD) {
        // Double check against localhost/127.0.0.1
        const possibleUrls = [
          import.meta.env.VITE_WS_BASE_URL,
          import.meta.env.VITE_WS_URL,
          import.meta.env.VITE_PROD_WS_URL
        ];

        // If we have a valid non-localhost URL in env, use it.
        for (const url of possibleUrls) {
          if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
            return url;
          }
        }

        // Fallback to hardcoded production URL if env vars are missing or dangerous
        return 'coastal-backend-annc.onrender.com';
      }

      // DEVELOPMENT: Use env vars or default to localhost
      if (import.meta.env.VITE_WS_BASE_URL) return import.meta.env.VITE_WS_BASE_URL;
      if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
      if (import.meta.env.VITE_DEV_WS_URL) return import.meta.env.VITE_DEV_WS_URL;

      return 'localhost:8001';
    };

    const wsBaseUrl = getWebSocketBaseUrl();
    const wsUrl = `${protocol}//${wsBaseUrl}/ws/messaging/${this.threadId}/?token=${token}`;

    try {
      console.log('[WEBSOCKET] Connecting to:', wsUrl.replace(token, '[TOKEN]'));
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WEBSOCKET] Connected to thread:', this.threadId);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(true);
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WEBSOCKET] Received:', data.type);

          switch (data.type) {
            case 'new_message':
              this.onMessage?.(data);
              break;
            case 'reaction_added':
            case 'reaction_removed':
              this.onReaction?.(data);
              break;
            case 'typing_start':
            case 'typing_stop':
              this.onTyping?.(data);
              break;
            case 'presence_update':
              this.onPresence?.(data);
              break;
            case 'call_offer':
            case 'call_answer':
            case 'new_ice_candidate':
            case 'call_end':
            case 'call_busy':
              this.onSignal?.(data);
              break;
            case 'pong':
              // Heartbeat response
              break;
            default:
              this.onMessage?.(data);
          }
        } catch (error) {
          console.error('[WEBSOCKET] Error parsing message:', error);
          this.onError?.(error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WEBSOCKET] Disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.onConnectionChange?.(false);

        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WEBSOCKET] Error:', error);
        this.onError?.(error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('[WEBSOCKET] Error creating connection:', error);
      this.onError?.(error);
      this.isConnecting = false;
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WEBSOCKET] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  sendMessage(messageData) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WEBSOCKET] Sending message:', messageData.type);
      this.ws.send(JSON.stringify(messageData));
      return true;
    } else {
      console.warn('[WEBSOCKET] Not connected, cannot send message');
      return false;
    }
  }

  sendTyping(isTyping) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: isTyping ? 'typing_start' : 'typing_stop',
        user_id: null // Will be set by backend
      }));
    }
  }

  // Signaling methods for WebRTC
  sendOffer(offer, targetUserId) {
    return this.sendMessage({
      type: 'call_offer',
      offer: offer,
      sender_id: this.userId,
      target_user_id: targetUserId
    });
  }

  sendAnswer(answer, targetUserId) {
    return this.sendMessage({
      type: 'call_answer',
      answer: answer,
      sender_id: this.userId,
      target_user_id: targetUserId
    });
  }

  sendCandidate(candidate, targetUserId) {
    return this.sendMessage({
      type: 'new_ice_candidate',
      candidate: candidate,
      sender_id: this.userId,
      target_user_id: targetUserId
    });
  }

  sendEndCall(targetUserId) {
    return this.sendMessage({
      type: 'call_end',
      sender_id: this.userId,
      target_user_id: targetUserId
    });
  }

  sendBusy(targetUserId) {
    return this.sendMessage({
      type: 'call_busy',
      sender_id: this.userId,
      target_user_id: targetUserId
    });
  }

  disconnect() {
    console.log('[WEBSOCKET] Disconnecting...');
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Component unmounting');
      this.ws = null;
    }
    this.isConnecting = false;
  }
}

export default EnhancedWebSocketManager;