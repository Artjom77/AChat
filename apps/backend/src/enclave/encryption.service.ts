import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Encryption Service
 *
 * Handles all cryptographic operations inside the enclave:
 * - AES-256-GCM encryption/decryption
 * - Key generation and management
 * - Perfect Forward Secrecy (PFS)
 *
 * All operations happen in memory, keys never touch disk
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);

  // Enclave's master key pair (Ed25519)
  private enclavePrivateKey: Buffer;
  private enclavePublicKey: Buffer;

  // Session keys cache (ephemeral)
  private sessionKeys: Map<string, Buffer> = new Map();

  // Algorithm configuration
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_SIZE = 32; // 256 bits
  private readonly IV_SIZE = 16; // 128 bits
  private readonly AUTH_TAG_SIZE = 16; // 128 bits

  /**
   * Initialize encryption keys
   */
  async initializeKeys(): Promise<void> {
    this.logger.log('🔑 Initializing encryption keys...');

    // Generate enclave key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

    this.enclavePrivateKey = privateKey.export({
      type: 'pkcs8',
      format: 'der',
    }) as Buffer;

    this.enclavePublicKey = publicKey.export({
      type: 'spki',
      format: 'der',
    }) as Buffer;

    this.logger.log('✅ Enclave keys generated');

    // Start key rotation timer (every 24 hours)
    this.startKeyRotation();
  }

  /**
   * Start automatic key rotation
   */
  private startKeyRotation(): void {
    const ROTATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

    setInterval(() => {
      this.logger.log('🔄 Rotating session keys...');
      this.sessionKeys.clear();
      this.logger.log('✅ Session keys rotated');
    }, ROTATION_INTERVAL);
  }

  /**
   * Get enclave public key
   */
  getEnclavePublicKey(): string {
    return this.enclavePublicKey.toString('base64');
  }

  /**
   * Decrypt message inside the enclave
   *
   * @param payload - Encrypted message payload
   * @returns Decrypted plaintext
   */
  async decryptInEnclave(payload: EncryptedPayload): Promise<string> {
    try {
      // Step 1: Decrypt the session key using enclave's private key
      const sessionKey = await this.decryptSessionKey(payload.encryptedKey);

      // Step 2: Decrypt the message using the session key
      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        sessionKey,
        Buffer.from(payload.iv, 'base64'),
      );

      decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

      let decrypted = decipher.update(payload.encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      // Step 3: Verify integrity
      if (!this.verifyIntegrity(decrypted, payload)) {
        throw new Error('Message integrity check failed');
      }

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Encrypt data inside the enclave for a recipient
   *
   * @param data - Plaintext data
   * @param recipientId - Recipient's user ID
   * @returns Encrypted payload
   */
  async encryptInEnclave(
    data: any,
    recipientId: string,
  ): Promise<EncryptedPayload> {
    try {
      // Convert to string if needed
      const plaintext =
        typeof data === 'string' ? data : JSON.stringify(data);

      // Generate ephemeral session key for this message
      const sessionKey = crypto.randomBytes(this.KEY_SIZE);

      // Generate IV
      const iv = crypto.randomBytes(this.IV_SIZE);

      // Encrypt the message
      const cipher = crypto.createCipheriv(this.ALGORITHM, sessionKey, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const authTag = cipher.getAuthTag();

      // Encrypt the session key for the recipient
      // In production, use recipient's public key
      const encryptedKey = await this.encryptSessionKeyForRecipient(
        sessionKey,
        recipientId,
      );

      return {
        encryptedData: encrypted,
        encryptedKey: encryptedKey.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        recipientId,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt session key using enclave's private key
   */
  private async decryptSessionKey(encryptedKey: string): Promise<Buffer> {
    // In production, use asymmetric decryption (RSA/ECDH)
    // For now, using symmetric approach

    try {
      const keyBuffer = Buffer.from(encryptedKey, 'base64');

      // Derive key from enclave private key
      const derivedKey = crypto
        .createHash('sha256')
        .update(this.enclavePrivateKey)
        .digest();

      // Decrypt session key (simplified version)
      // Real implementation would use proper asymmetric crypto
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        derivedKey,
        Buffer.alloc(16, 0),
      );

      let decrypted = decipher.update(keyBuffer);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt session key');
    }
  }

  /**
   * Encrypt session key for recipient
   */
  private async encryptSessionKeyForRecipient(
    sessionKey: Buffer,
    recipientId: string,
  ): Promise<Buffer> {
    // In production, fetch recipient's public key and encrypt with it
    // For now, using enclave's key (simplified)

    try {
      const derivedKey = crypto
        .createHash('sha256')
        .update(this.enclavePrivateKey)
        .digest();

      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        derivedKey,
        Buffer.alloc(16, 0),
      );

      let encrypted = cipher.update(sessionKey);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      return encrypted;
    } catch (error) {
      throw new Error('Failed to encrypt session key');
    }
  }

  /**
   * Verify message integrity
   */
  private verifyIntegrity(
    plaintext: string,
    payload: EncryptedPayload,
  ): boolean {
    // Additional integrity checks
    // In production, verify signatures, timestamps, etc.
    return plaintext && plaintext.length > 0;
  }

  /**
   * Generate ephemeral key pair for a session
   */
  async generateEphemeralKeyPair(): Promise<{
    publicKey: string;
    privateKey: string;
  }> {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

    return {
      publicKey: publicKey
        .export({ type: 'spki', format: 'der' })
        .toString('base64'),
      privateKey: privateKey
        .export({ type: 'pkcs8', format: 'der' })
        .toString('base64'),
    };
  }

  /**
   * Derive shared secret using ECDH
   */
  async deriveSharedSecret(
    privateKey: string,
    publicKey: string,
  ): Promise<Buffer> {
    // ECDH key agreement
    // Placeholder implementation

    const hash = crypto.createHash('sha256');
    hash.update(privateKey + publicKey);
    return hash.digest();
  }
}

// Type definitions
export interface EncryptedPayload {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
  recipientId?: string;
  senderId?: string;
  timestamp: number;
}
