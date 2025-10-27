import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { UsersService } from '../users/users.service';

/**
 * WebSocket Gateway for real-time messaging
 *
 * Handles:
 * - Real-time message delivery
 * - Typing indicators
 * - Online/offline status
 * - Read receipts
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Configure properly in production
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  // Map of userId -> socketId
  private userSockets: Map<string, string> = new Map();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      // Extract user ID from auth token
      const userId = await this.getUserIdFromSocket(client);

      if (!userId) {
        client.disconnect();
        return;
      }

      // Store socket mapping
      this.userSockets.set(userId, client.id);

      // Update user online status
      await this.usersService.updateLastSeen(userId);

      // Join user to their personal room
      client.join(`user:${userId}`);

      // Notify about online status
      this.server.emit('user:online', { userId });

      this.logger.log(`User ${userId} connected (${client.id})`);
    } catch (error) {
      this.logger.error('Connection error', error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnect(client: Socket) {
    try {
      const userId = await this.getUserIdFromSocket(client);

      if (userId) {
        this.userSockets.delete(userId);

        // Update last seen
        await this.usersService.updateLastSeen(userId);

        // Notify about offline status
        this.server.emit('user:offline', { userId });

        this.logger.log(`User ${userId} disconnected`);
      }
    } catch (error) {
      this.logger.error('Disconnection error', error);
    }
  }

  /**
   * Handle new message from client
   */
  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const userId = await this.getUserIdFromSocket(client);

      if (!userId) {
        return { error: 'Unauthorized' };
      }

      // Send message through service
      const message = await this.messagesService.sendMessage(userId, data);

      // Get conversation to find recipients
      const conversation = await this.messagesService['conversationRepository'].findOne({
        where: { id: data.conversationId },
      });

      if (!conversation) {
        return { error: 'Conversation not found' };
      }

      // Emit to all participants except sender
      conversation.participantIds
        .filter((id) => id !== userId)
        .forEach((recipientId) => {
          this.server.to(`user:${recipientId}`).emit('message:new', message);
        });

      // Mark as delivered for online users
      await this.messagesService.markAsDelivered(message.id);

      return { success: true, message };
    } catch (error) {
      this.logger.error('Error handling message', error);
      return { error: error.message };
    }
  }

  /**
   * Handle typing indicator
   */
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = await this.getUserIdFromSocket(client);

    if (!userId) {
      return;
    }

    // Broadcast to conversation participants
    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('typing:start', {
        userId,
        conversationId: data.conversationId,
      });
  }

  /**
   * Handle typing stop
   */
  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = await this.getUserIdFromSocket(client);

    if (!userId) {
      return;
    }

    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('typing:stop', {
        userId,
        conversationId: data.conversationId,
      });
  }

  /**
   * Handle message read
   */
  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = await this.getUserIdFromSocket(client);

    if (!userId) {
      return;
    }

    await this.messagesService.markAsRead(data.messageId, userId);

    // Notify sender
    this.server.emit('message:read', {
      messageId: data.messageId,
      userId,
    });
  }

  /**
   * Extract user ID from socket authentication
   */
  private async getUserIdFromSocket(socket: Socket): Promise<string | null> {
    try {
      // In production, verify JWT token from socket handshake
      const token = socket.handshake.auth.token;

      if (!token) {
        return null;
      }

      // Parse token and extract user ID
      // For now, returning mock data
      return socket.handshake.auth.userId || null;
    } catch {
      return null;
    }
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
