/**
 * @achat/types
 * Shared TypeScript types for AChat project
 */

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  subscriptionTier: SubscriptionTier;
  publicKey?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt?: Date;
}

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  BUSINESS = 'business',
}

// Message types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
  type: MessageType;
  status: MessageStatus;
  metadata?: MessageMetadata;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface MessageMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
  thumbnailUrl?: string;
}

// Conversation types
export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatar?: string;
  participantIds: string[];
  creatorId?: string;
  lastMessageId?: string;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel',
}

// Encryption types
export interface EncryptedPayload {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
  timestamp: number;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

// AI types
export interface AiModerationResult {
  allowed: boolean;
  riskScore: number;
  flags: string[];
  requiresHumanReview: boolean;
  reason?: string;
}

export interface AiAssistantSuggestion {
  text: string;
  confidence: number;
  reasoning?: string;
}

export interface AiAssistantResponse {
  suggestions: AiAssistantSuggestion[];
  sentiment: 'positive' | 'neutral' | 'negative';
  context: Record<string, any>;
}

// WebSocket events
export enum WebSocketEvent {
  MESSAGE_NEW = 'message:new',
  MESSAGE_READ = 'message:read',
  MESSAGE_DELIVERED = 'message:delivered',
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  CALL_INCOMING = 'call:incoming',
  CALL_ACCEPTED = 'call:accepted',
  CALL_ENDED = 'call:ended',
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Enclave types
export interface EnclaveStatus {
  ready: boolean;
  enclaveId: string;
  publicKey: string;
  attestation: AttestationDocument;
  uptime: number;
}

export interface AttestationDocument {
  version: number;
  enclaveId: string;
  timestamp: number;
  codeHash: string;
  pcrs: Record<string, string>;
  userData: string;
  nonce: string;
  signature: string;
}

// Payment types
export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  type: 'subscription' | 'gift' | 'other';
  createdAt: Date;
}

// Gift types
export interface Gift {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  animationUrl?: string;
  category: string;
}

export interface GiftTransaction {
  id: string;
  giftId: string;
  senderId: string;
  recipientId: string;
  messageId?: string;
  createdAt: Date;
}
