import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { addMessage, updateMessageStatus } from '../store/slices/messagesSlice';
import { updateFriendStatus } from '../store/slices/contactsSlice';

const WEBSOCKET_URL = __DEV__
  ? 'http://localhost:5000'
  : 'https://achat.app';

export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        throw new Error('No auth token');
      }

      this.socket = io(WEBSOCKET_URL, {
        auth: {
          token: token,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventListeners();

      console.log('WebSocket connecting...');
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Message events
    this.socket.on('message', (data: any) => {
      console.log('📩 New message:', data);
      store.dispatch(addMessage(data.message));
    });

    this.socket.on('message:status', (data: any) => {
      console.log('📬 Message status update:', data);
      store.dispatch(
        updateMessageStatus({
          messageId: data.messageId,
          status: data.status,
        })
      );
    });

    // User status events
    this.socket.on('user:online', (data: any) => {
      console.log('🟢 User online:', data.userId);
      store.dispatch(
        updateFriendStatus({
          userId: data.userId,
          status: 'online',
        })
      );
    });

    this.socket.on('user:offline', (data: any) => {
      console.log('⚫ User offline:', data.userId);
      store.dispatch(
        updateFriendStatus({
          userId: data.userId,
          status: 'offline',
        })
      );
    });

    // Typing events
    this.socket.on('typing:start', (data: any) => {
      console.log('✍️ User typing:', data.userId);
      // TODO: Dispatch typing action
    });

    this.socket.on('typing:stop', (data: any) => {
      console.log('✋ User stopped typing:', data.userId);
      // TODO: Dispatch typing stopped action
    });

    // Friend request events
    this.socket.on('friend:request', (data: any) => {
      console.log('👥 New friend request:', data);
      // TODO: Dispatch friend request action
    });

    // Call events (for future video/voice calls)
    this.socket.on('call:incoming', (data: any) => {
      console.log('📞 Incoming call:', data);
      // TODO: Handle incoming call
    });
  }

  /**
   * Send message via WebSocket
   */
  sendMessage(conversationId: string, message: any): void {
    if (!this.socket || !this.socket.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit('message:send', {
      conversationId,
      message,
    });
  }

  /**
   * Join conversation room
   */
  joinConversation(conversationId: string): void {
    if (!this.socket || !this.socket.connected) return;

    this.socket.emit('conversation:join', { conversationId });
    console.log('Joined conversation:', conversationId);
  }

  /**
   * Leave conversation room
   */
  leaveConversation(conversationId: string): void {
    if (!this.socket || !this.socket.connected) return;

    this.socket.emit('conversation:leave', { conversationId });
    console.log('Left conversation:', conversationId);
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean): void {
    if (!this.socket || !this.socket.connected) return;

    this.socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      conversationId,
    });
  }

  /**
   * Mark messages as read
   */
  markAsRead(conversationId: string, messageIds: string[]): void {
    if (!this.socket || !this.socket.connected) return;

    this.socket.emit('messages:read', {
      conversationId,
      messageIds,
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
let instance: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!instance) {
    instance = new WebSocketService();
  }
  return instance;
};

export default WebSocketService;
