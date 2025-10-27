import { Module } from '@nestjs/common';
import { EnclaveService } from './enclave.service';
import { EnclaveController } from './enclave.controller';
import { AttestationService } from './attestation.service';
import { EncryptionService } from './encryption.service';

/**
 * Enclave Module
 *
 * This module manages the secure enclave (TEE - Trusted Execution Environment)
 * where all sensitive operations occur:
 * - Message encryption/decryption
 * - AI moderation
 * - AI assistant processing
 * - Key management
 *
 * Implementation uses:
 * - AWS Nitro Enclaves (production)
 * - Intel SGX (alternative)
 * - Simulated secure zone (development)
 */
@Module({
  controllers: [EnclaveController],
  providers: [EnclaveService, AttestationService, EncryptionService],
  exports: [EnclaveService, AttestationService, EncryptionService],
})
export class EnclaveModule {}
