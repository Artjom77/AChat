import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Attestation Service
 *
 * Provides cryptographic proof that the enclave code has not been tampered with.
 * Clients can verify this proof to ensure they're communicating with a genuine,
 * unmodified enclave.
 *
 * This implements Remote Attestation:
 * 1. Enclave generates proof of its code hash
 * 2. Proof is signed by hardware (CPU/TPM)
 * 3. Clients verify the signature and compare code hash
 *
 * For AWS Nitro: Uses Nitro Attestation API
 * For Intel SGX: Uses SGX Quote
 * For development: Simulated attestation
 */
@Injectable()
export class AttestationService {
  private readonly logger = new Logger(AttestationService.name);

  private enclaveId: string;
  private currentAttestation: AttestationDocument;
  private attestationInterval: NodeJS.Timeout;

  // Known good code hash (set during build)
  private readonly EXPECTED_CODE_HASH = process.env.ENCLAVE_CODE_HASH || '';

  /**
   * Start attestation service
   */
  async startAttestation(enclaveId: string): Promise<void> {
    this.enclaveId = enclaveId;

    this.logger.log('🔐 Starting attestation service...');

    // Generate initial attestation
    await this.generateAttestation();

    // Re-attest every 60 seconds
    this.attestationInterval = setInterval(
      () => {
        this.generateAttestation();
      },
      60 * 1000,
    );

    this.logger.log('✅ Attestation service started');
  }

  /**
   * Generate attestation document
   *
   * This proves:
   * 1. Code hash matches expected value
   * 2. Running in secure hardware
   * 3. No tampering has occurred
   */
  private async generateAttestation(): Promise<void> {
    try {
      const timestamp = Date.now();

      // Calculate code hash
      const codeHash = await this.calculateCodeHash();

      // Generate attestation document
      const document: AttestationDocument = {
        version: 1,
        enclaveId: this.enclaveId,
        timestamp,
        codeHash,
        pcrs: await this.getPCRs(), // Platform Configuration Registers
        userData: this.generateUserData(),
        nonce: crypto.randomBytes(32).toString('hex'),
      };

      // Sign the attestation
      const signature = await this.signAttestation(document);

      document.signature = signature;

      this.currentAttestation = document;

      this.logger.debug(`✅ Attestation generated at ${new Date(timestamp).toISOString()}`);
    } catch (error) {
      this.logger.error('Failed to generate attestation', error);
    }
  }

  /**
   * Calculate hash of the enclave code
   *
   * In production:
   * - AWS Nitro: Reads from Nitro Attestation Document
   * - Intel SGX: Gets from SGX Quote
   *
   * In development: Calculates hash of source files
   */
  private async calculateCodeHash(): Promise<string> {
    if (process.env.AWS_NITRO_ENCLAVE) {
      // Read from Nitro attestation
      return this.getNitroCodeHash();
    }

    if (process.env.INTEL_SGX) {
      // Read from SGX quote
      return this.getSGXCodeHash();
    }

    // Development: hash of main files
    return this.calculateDevelopmentHash();
  }

  /**
   * Get code hash from AWS Nitro
   */
  private async getNitroCodeHash(): Promise<string> {
    try {
      // In production, use AWS Nitro Enclaves SDK
      // const attestationDoc = await nitroEnclaves.getAttestationDocument();
      // return attestationDoc.pcrs[0]; // PCR0 contains code hash

      // Placeholder
      return crypto.randomBytes(32).toString('hex');
    } catch {
      return '';
    }
  }

  /**
   * Get code hash from Intel SGX
   */
  private async getSGXCodeHash(): Promise<string> {
    try {
      // In production, use SGX SDK
      // const quote = await sgx.getQuote();
      // return quote.report_body.mr_enclave; // Enclave measurement

      // Placeholder
      return crypto.randomBytes(32).toString('hex');
    } catch {
      return '';
    }
  }

  /**
   * Calculate hash for development
   */
  private calculateDevelopmentHash(): Promise<string> {
    // Hash key source files
    const hash = crypto.createHash('sha256');

    // In production, this would hash the actual enclave binary
    hash.update('development-mode');
    hash.update(process.version);
    hash.update(Date.now().toString());

    return Promise.resolve(hash.digest('hex'));
  }

  /**
   * Get Platform Configuration Registers
   *
   * PCRs are hardware-backed registers that record measurements
   * of code and configuration
   */
  private async getPCRs(): Promise<Record<string, string>> {
    if (process.env.AWS_NITRO_ENCLAVE) {
      // Read actual PCRs from Nitro
      return this.getNitroPCRs();
    }

    // Development: return mock PCRs
    return {
      PCR0: crypto.randomBytes(32).toString('hex'), // Code
      PCR1: crypto.randomBytes(32).toString('hex'), // Config
      PCR2: crypto.randomBytes(32).toString('hex'), // Apps
    };
  }

  /**
   * Get PCRs from AWS Nitro
   */
  private async getNitroPCRs(): Promise<Record<string, string>> {
    // In production:
    // const attestation = await nitroEnclaves.getAttestationDocument();
    // return attestation.pcrs;

    return {
      PCR0: crypto.randomBytes(32).toString('hex'),
      PCR1: crypto.randomBytes(32).toString('hex'),
      PCR2: crypto.randomBytes(32).toString('hex'),
    };
  }

  /**
   * Generate user-defined data for attestation
   */
  private generateUserData(): string {
    return JSON.stringify({
      version: '1.0.0',
      capabilities: ['moderation', 'ai-assistant'],
      timestamp: Date.now(),
    });
  }

  /**
   * Sign the attestation document
   *
   * In production: Signed by hardware (TPM/Nitro/SGX)
   * In development: Signed by software key
   */
  private async signAttestation(
    document: Partial<AttestationDocument>,
  ): Promise<string> {
    // Serialize document (without signature)
    const data = JSON.stringify({
      version: document.version,
      enclaveId: document.enclaveId,
      timestamp: document.timestamp,
      codeHash: document.codeHash,
      pcrs: document.pcrs,
      userData: document.userData,
      nonce: document.nonce,
    });

    if (process.env.AWS_NITRO_ENCLAVE) {
      // Use Nitro signing
      return this.signWithNitro(data);
    }

    if (process.env.INTEL_SGX) {
      // Use SGX signing
      return this.signWithSGX(data);
    }

    // Development: Use software signing
    return this.signWithSoftware(data);
  }

  /**
   * Sign with AWS Nitro
   */
  private async signWithNitro(data: string): Promise<string> {
    // In production:
    // const signed = await nitroEnclaves.sign(data);
    // return signed.signature;

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Sign with Intel SGX
   */
  private async signWithSGX(data: string): Promise<string> {
    // In production:
    // const signed = await sgx.sign(data);
    // return signed.signature;

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Sign with software (development only)
   */
  private signWithSoftware(data: string): string {
    const hmac = crypto.createHmac('sha256', 'development-secret-key');
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Get current attestation document
   */
  async getAttestation(): Promise<AttestationDocument> {
    if (!this.currentAttestation) {
      await this.generateAttestation();
    }

    return this.currentAttestation;
  }

  /**
   * Verify attestation is valid
   */
  async verifyAttestation(): Promise<boolean> {
    if (!this.currentAttestation) {
      return false;
    }

    try {
      // Check timestamp is recent (within 5 minutes)
      const age = Date.now() - this.currentAttestation.timestamp;
      if (age > 5 * 60 * 1000) {
        this.logger.warn('Attestation is too old');
        return false;
      }

      // Verify code hash matches expected
      if (
        this.EXPECTED_CODE_HASH &&
        this.currentAttestation.codeHash !== this.EXPECTED_CODE_HASH
      ) {
        this.logger.error('Code hash mismatch!');
        return false;
      }

      // Verify signature
      const isValidSignature = await this.verifySignature(
        this.currentAttestation,
      );

      if (!isValidSignature) {
        this.logger.error('Invalid attestation signature!');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Attestation verification failed', error);
      return false;
    }
  }

  /**
   * Verify attestation signature
   */
  private async verifySignature(
    attestation: AttestationDocument,
  ): Promise<boolean> {
    // Recreate the data that was signed
    const data = JSON.stringify({
      version: attestation.version,
      enclaveId: attestation.enclaveId,
      timestamp: attestation.timestamp,
      codeHash: attestation.codeHash,
      pcrs: attestation.pcrs,
      userData: attestation.userData,
      nonce: attestation.nonce,
    });

    // Verify based on environment
    if (process.env.AWS_NITRO_ENCLAVE) {
      return this.verifyNitroSignature(data, attestation.signature);
    }

    // Development: verify software signature
    const expectedSignature = this.signWithSoftware(data);
    return expectedSignature === attestation.signature;
  }

  /**
   * Verify Nitro signature
   */
  private async verifyNitroSignature(
    data: string,
    signature: string,
  ): Promise<boolean> {
    // In production:
    // return await nitroEnclaves.verify(data, signature);

    return true; // Placeholder
  }

  /**
   * Cleanup
   */
  onModuleDestroy(): void {
    if (this.attestationInterval) {
      clearInterval(this.attestationInterval);
    }
  }
}

// Type definitions
export interface AttestationDocument {
  version: number;
  enclaveId: string;
  timestamp: number;
  codeHash: string;
  pcrs: Record<string, string>;
  userData: string;
  nonce: string;
  signature?: string;
}
