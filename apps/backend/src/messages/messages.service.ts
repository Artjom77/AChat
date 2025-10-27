import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageStatus } from './entities/message.entity';
import { Conversation, ConversationType } from './entities/conversation.entity';
import { EnclaveService } from '../enclave/enclave.service';
import { UsersService } from '../users/users.service';
import { SendMessageDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly enclaveService: EnclaveService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Send a message
   *
   * Flow:
   * 1. Validate sender has access to conversation
   * 2. Process message through enclave (encryption + moderation)
   * 3. Save to database
   * 4. Emit to WebSocket for real-time delivery
   */
  async sendMessage(
    senderId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<Message> {
    // Validate conversation
    const conversation = await this.conversationRepository.findOne({
      where: { id: sendMessageDto.conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if sender is a participant
    if (!conversation.participantIds.includes(senderId)) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    // Process message through enclave
    const processedMessage = await this.enclaveService.processMessage(
      {
        encryptedData: sendMessageDto.encryptedContent,
        encryptedKey: sendMessageDto.encryptedKey,
        iv: sendMessageDto.iv,
        authTag: sendMessageDto.authTag,
        senderId: senderId,
        recipientId: this.getRecipientId(conversation, senderId),
        timestamp: Date.now(),
      },
      'moderate', // First moderate
    );

    // Check if message was blocked by moderation
    const isBlocked = !processedMessage.metadata.moderated;

    // Create message
    const message = this.messageRepository.create({
      conversationId: sendMessageDto.conversationId,
      senderId: senderId,
      encryptedContent: processedMessage.encryptedData,
      encryptedKey: processedMessage.encryptedKey,
      iv: processedMessage.iv,
      authTag: processedMessage.authTag,
      type: sendMessageDto.type,
      status: isBlocked ? MessageStatus.MODERATED : MessageStatus.SENT,
      isBlocked: isBlocked,
      metadata: sendMessageDto.metadata,
      replyToId: sendMessageDto.replyToId,
    });

    // Save message
    const savedMessage = await this.messageRepository.save(message);

    // Update conversation
    await this.updateConversationLastActivity(conversation.id, savedMessage.id);

    return savedMessage;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    userId: string,
    conversationId: string,
    limit: number = 50,
    before?: string,
  ): Promise<Message[]> {
    // Validate user has access
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('No access to this conversation');
    }

    const query = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('message.isBlocked = false') // Don't show blocked messages
      .orderBy('message.createdAt', 'DESC')
      .limit(limit);

    if (before) {
      query.andWhere('message.createdAt < :before', { before: new Date(before) });
    }

    return await query.getMany();
  }

  /**
   * Get or create direct conversation
   */
  async getOrCreateDirectConversation(
    user1Id: string,
    user2Id: string,
  ): Promise<Conversation> {
    // Try to find existing conversation
    const existing = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.type = :type', { type: ConversationType.DIRECT })
      .andWhere(':user1 = ANY(conversation.participantIds)', { user1: user1Id })
      .andWhere(':user2 = ANY(conversation.participantIds)', { user2: user2Id })
      .getOne();

    if (existing) {
      return existing;
    }

    // Create new conversation
    const conversation = this.conversationRepository.create({
      type: ConversationType.DIRECT,
      participantIds: [user1Id, user2Id],
      settings: {
        isEncrypted: true,
        aiModerationEnabled: true,
      },
    });

    return await this.conversationRepository.save(conversation);
  }

  /**
   * Create group conversation
   */
  async createGroupConversation(
    creatorId: string,
    name: string,
    participantIds: string[],
  ): Promise<Conversation> {
    // Ensure creator is included
    if (!participantIds.includes(creatorId)) {
      participantIds.push(creatorId);
    }

    const conversation = this.conversationRepository.create({
      type: ConversationType.GROUP,
      name,
      creatorId,
      participantIds,
      settings: {
        isEncrypted: true,
        aiModerationEnabled: true,
        allowInvites: true,
        maxParticipants: 10000,
      },
    });

    return await this.conversationRepository.save(conversation);
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await this.conversationRepository
      .createQueryBuilder('conversation')
      .where(':userId = ANY(conversation.participantIds)', { userId })
      .orderBy('conversation.lastActivityAt', 'DESC')
      .getMany();
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered(messageId: string): Promise<void> {
    await this.messageRepository.update(messageId, {
      status: MessageStatus.DELIVERED,
      deliveredAt: new Date(),
    });
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only recipient can mark as read
    if (message.senderId === userId) {
      return; // Sender can't mark their own message as read
    }

    await this.messageRepository.update(messageId, {
      status: MessageStatus.READ,
      readAt: new Date(),
    });
  }

  /**
   * Update conversation last activity
   */
  private async updateConversationLastActivity(
    conversationId: string,
    lastMessageId: string,
  ): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      lastMessageId,
      lastActivityAt: new Date(),
    });
  }

  /**
   * Get recipient ID for direct messages
   */
  private getRecipientId(conversation: Conversation, senderId: string): string {
    if (conversation.type === ConversationType.DIRECT) {
      return conversation.participantIds.find((id) => id !== senderId) || '';
    }
    // For groups, we'll need to handle multiple recipients
    return '';
  }
}
