import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type: ConversationType;

  @Column({ nullable: true })
  name: string; // For groups/channels

  @Column({ nullable: true })
  avatar: string; // For groups/channels

  @Column({ type: 'simple-array' })
  participantIds: string[];

  @Column({ nullable: true })
  creatorId: string; // For groups/channels

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    isEncrypted?: boolean;
    aiModerationEnabled?: boolean;
    allowInvites?: boolean;
    maxParticipants?: number;
  };

  @Column({ nullable: true })
  lastMessageId: string;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
