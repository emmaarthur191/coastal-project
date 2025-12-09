// Enhanced WebSocket Manager with typing indicators and presence
class EnhancedWebSocketManager {
  constructor(threadId, onMessage, onError, onConnectionChange, onTyping, onPresence, onReaction) {
    this.threadId = threadId;
    this.onMessage = onMessage;
    this.onError = onError;
    this.onConnectionChange = onConnectionChange;
    this.onTyping = onTyping;
    this.onPresence = onPresence;
    this.onReaction = onReaction;
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
      // Check for VITE_WS_BASE_URL (used in docker-compose)
      if (import.meta.env.VITE_WS_BASE_URL) {
        return import.meta.env.VITE_WS_BASE_URL;
      }
      // Check for VITE_WS_URL for Railway
      if (import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL;
      }
      // In production, use environment variable or fallback
      if (import.meta.env.PROD) {
        if (import.meta.env.VITE_PROD_WS_URL) {
          return import.meta.env.VITE_PROD_WS_URL;
        }
        throw new Error('VITE_PROD_WS_URL environment variable is required in production');
      }
      // In development, use localhost:8001 (since 8000 is occupied)
      if (import.meta.env.VITE_DEV_WS_URL) {
        return import.meta.env.VITE_DEV_WS_URL;
      }
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