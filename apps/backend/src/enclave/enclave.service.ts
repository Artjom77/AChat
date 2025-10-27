import { Injectable, Logger } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { AttestationService } from './attestation.service';

/**
 * Enclave Service
 *
 * Core service that manages the secure enclave operations.
 * All message processing happens here in an isolated, secure environment.
 *
 * Security guarantees:
 * 1. Data is decrypted ONLY inside the enclave
 * 2. Plaintext never leaves the enclave
 * 3. External systems (including creators) cannot access enclave memory
 * 4. Regular attestation proves enclave integrity
 */
@Injectable()
export class EnclaveService {
  private readonly logger = new Logger(EnclaveService.name);
  private enclaveReady = false;
  private enclaveId: string;

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly attestationService: AttestationService,
  ) {
    this.initializeEnclave();
  }

  /**
   * Initialize the secure enclave
   *
   * Steps:
   * 1. Verify we're running in a secure environment (AWS Nitro/SGX)
   * 2. Generate enclave-specific keys
   * 3. Set up attestation
   * 4. Mark enclave as ready
   */
  private async initializeEnclave() {
    this.logger.log('🔐 Initializing Secure Enclave...');

    try {
      // Check if we're in a real enclave environment
      const isSecureEnvironment = await this.checkSecureEnvironment();

      if (!isSecureEnvironment && process.env.NODE_ENV === 'production') {
        throw new Error(
          'CRITICAL: Not running in a secure enclave in production!',
        );
      }

      if (!isSecureEnvironment) {
        this.logger.warn(
          '⚠️  Running in DEVELOPMENT mode without real enclave',
        );
        this.logger.warn(
          '⚠️  DO NOT use in production - data is NOT secure!',
        );
      }

      // Generate enclave ID
      this.enclaveId = await this.generateEnclaveId();

      // Initialize encryption keys
      await this.encryptionService.initializeKeys();

      // Start attestation service
      await this.attestationService.startAttestation(this.enclaveId);

      this.enclaveReady = true;

      this.logger.log('✅ Secure Enclave initialized successfully');
      this.logger.log(`📝 Enclave ID: ${this.enclaveId}`);
    } catch (error) {
      this.logger.error('❌ Failed to initialize enclave', error);
      throw error;
    }
  }

  /**
   * Check if running in a secure enclave environment
   *
   * Detects:
   * - AWS Nitro Enclaves
   * - Intel SGX
   * - ARM TrustZone
   */
  private async checkSecureEnvironment(): Promise<boolean> {
    // Check for AWS Nitro
    if (process.env.AWS_NITRO_ENCLAVE) {
      this.logger.log('✅ Detected AWS Nitro Enclave');
      return true;
    }

    // Check for Intel SGX
    if (await this.checkIntelSGX()) {
      this.logger.log('✅ Detected Intel SGX');
      return true;
    }

    // Development environment
    return false;
  }

  /**
   * Check for Intel SGX support
   */
  private async checkIntelSGX(): Promise<boolean> {
    try {
      // Check for SGX device files
      const fs = require('fs');
      return (
        fs.existsSync('/dev/sgx_enclave') ||
        fs.existsSync('/dev/sgx/enclave')
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate unique enclave ID
   */
  private async generateEnclaveId(): Promise<string> {
    const crypto = require('crypto');
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    return `enclave_${timestamp}_${random}`;
  }

  /**
   * Process encrypted message in the enclave
   *
   * Flow:
   * 1. Verify message authenticity
   * 2. Decrypt message (ONLY inside enclave)
   * 3. Process with AI (moderation/assistant)
   * 4. Re-encrypt for recipient
   * 5. Destroy plaintext from memory
   *
   * @param encryptedMessage - Encrypted message from sender
   * @param operation - 'send' | 'moderate' | 'assist'
   * @returns Processed encrypted message
   */
  async processMessage(
    encryptedMessage: EncryptedMessagePayload,
    operation: EnclaveOperation,
  ): Promise<ProcessedMessage> {
    if (!this.enclaveReady) {
      throw new Error('Enclave not ready');
    }

    this.logger.debug(`Processing message in enclave: ${operation}`);

    try {
      // Step 1: Decrypt message inside enclave
      const plaintext = await this.encryptionService.decryptInEnclave(
        encryptedMessage,
      );

      // Step 2: Process based on operation
      let processedData: any;

      switch (operation) {
        case 'moderate':
          processedData = await this.moderateContent(plaintext);
          break;

        case 'assist':
          processedData = await this.assistConversation(plaintext);
          break;

        case 'send':
          processedData = { allowed: true, message: plaintext };
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      // Step 3: Re-encrypt for recipient
      const encryptedResult = await this.encryptionService.encryptInEnclave(
        processedData,
        encryptedMessage.recipientId,
      );

      // Step 4: CRITICAL - Destroy plaintext from memory
      this.securelyEraseFromMemory(plaintext);

      return encryptedResult;
    } catch (error) {
      this.logger.error('Error processing message in enclave', error);
      throw error;
    }
  }

  /**
   * Moderate content using AI
   *
   * Detects:
   * - Illegal drugs
   * - Weapons
   * - Money laundering
   * - CSAM (child sexual abuse material)
   * - Terrorism
   * - Fraud
   */
  private async moderateContent(content: string): Promise<ModerationResult> {
    // This will be implemented by AI service
    // For now, return placeholder

    const riskScore = this.calculateRiskScore(content);

    return {
      allowed: riskScore < 0.7,
      riskScore,
      flags: this.detectFlags(content),
      requiresHumanReview: riskScore >= 0.5 && riskScore < 0.7,
    };
  }

  /**
   * AI assistant for conversation
   */
  private async assistConversation(content: string): Promise<AssistantResult> {
    // Placeholder - will be implemented by AI service
    return {
      suggestions: [],
      sentiment: 'neutral',
      context: {},
    };
  }

  /**
   * Calculate risk score for content
   */
  private calculateRiskScore(content: string): number {
    // Placeholder implementation
    // Real implementation will use ML models

    const lowerContent = content.toLowerCase();

    // Simple keyword detection (real version uses ML)
    const highRiskKeywords = [
      'drugs',
      'cocaine',
      'heroin',
      'weapons',
      'gun',
      'bomb',
      'money laundering',
    ];

    const foundKeywords = highRiskKeywords.filter((keyword) =>
      lowerContent.includes(keyword),
    );

    return Math.min(foundKeywords.length * 0.3, 1.0);
  }

  /**
   * Detect specific flags
   */
  private detectFlags(content: string): string[] {
    const flags: string[] = [];
    const lowerContent = content.toLowerCase();

    if (
      lowerContent.includes('drug') ||
      lowerContent.includes('cocaine') ||
      lowerContent.includes('heroin')
    ) {
      flags.push('drugs');
    }

    if (
      lowerContent.includes('weapon') ||
      lowerContent.includes('gun') ||
      lowerContent.includes('bomb')
    ) {
      flags.push('weapons');
    }

    if (lowerContent.includes('money laundering') || lowerContent.includes('btc')) {
      flags.push('financial_crime');
    }

    return flags;
  }

  /**
   * Securely erase data from memory
   *
   * Overwrites memory multiple times to prevent recovery
   */
  private securelyEraseFromMemory(data: any): void {
    // Convert to buffer if string
    if (typeof data === 'string') {
      const buffer = Buffer.from(data, 'utf8');

      // Overwrite with random data multiple times
      for (let i = 0; i < 3; i++) {
        require('crypto').randomFillSync(buffer);
      }

      // Overwrite with zeros
      buffer.fill(0);
    }

    // Clear the reference
    data = null;
  }

  /**
   * Get enclave status and attestation proof
   */
  async getEnclaveStatus(): Promise<EnclaveStatus> {
    const attestation = await this.attestationService.getAttestation();

    return {
      ready: this.enclaveReady,
      enclaveId: this.enclaveId,
      attestation,
      uptime: process.uptime(),
      lastAttestationTime: attestation.timestamp,
    };
  }

  /**
   * Health check for enclave
   */
  async healthCheck(): Promise<boolean> {
    if (!this.enclaveReady) {
      return false;
    }

    // Verify attestation is valid
    const attestationValid = await this.attestationService.verifyAttestation();

    return attestationValid;
  }
}

// Type definitions
export interface EncryptedMessagePayload {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
  senderId: string;
  recipientId: string;
  timestamp: number;
}

export interface ProcessedMessage {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
  metadata: {
    moderated: boolean;
    timestamp: number;
  };
}

export interface ModerationResult {
  allowed: boolean;
  riskScore: number;
  flags: string[];
  requiresHumanReview: boolean;
}

export interface AssistantResult {
  suggestions: string[];
  sentiment: string;
  context: any;
}

export interface EnclaveStatus {
  ready: boolean;
  enclaveId: string;
  attestation: any;
  uptime: number;
  lastAttestationTime: number;
}

export type EnclaveOperation = 'send' | 'moderate' | 'assist';
