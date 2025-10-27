import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  VIDEO = 'video',
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  MODERATED = 'moderated',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column()
  senderId: string;

  @Column({ type: 'text' })
  encryptedContent: string; // Encrypted message content

  @Column({ type: 'text' })
  encryptedKey: string; // Encrypted session key

  @Column({ type: 'text' })
  iv: string; // Initialization vector

  @Column({ type: 'text' })
  authTag: string; // Authentication tag

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENDING,
  })
  status: MessageStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number; // For voice/video
    thumbnailUrl?: string;
  };

  // Moderation fields
  @Column({ default: false })
  isModerated: boolean;

  @Column({ type: 'float', default: 0 })
  moderationRiskScore: number;

  @Column({ type: 'jsonb', nullable: true })
  moderationFlags: string[];

  @Column({ default: false })
  requiresHumanReview: boolean;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ type: 'text', nullable: true })
  blockedReason: string;

  // Reply/Thread
  @Column({ nullable: true })
  replyToId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;
}
