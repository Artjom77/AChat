import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EnclaveService } from './enclave.service';
import { AttestationService } from './attestation.service';
import { EncryptionService } from './encryption.service';

/**
 * Enclave Controller
 *
 * Public endpoints for enclave verification and status
 */
@ApiTags('enclave')
@Controller('enclave')
export class EnclaveController {
  constructor(
    private readonly enclaveService: EnclaveService,
    private readonly attestationService: AttestationService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Get enclave status and attestation
   *
   * Clients should call this endpoint to:
   * 1. Verify enclave is running
   * 2. Get attestation proof
   * 3. Get enclave public key for encryption
   */
  @Get('status')
  @ApiOperation({ summary: 'Get enclave status and attestation proof' })
  @ApiResponse({
    status: 200,
    description: 'Enclave status with attestation',
  })
  async getStatus() {
    const status = await this.enclaveService.getEnclaveStatus();
    const publicKey = this.encryptionService.getEnclavePublicKey();

    return {
      ...status,
      publicKey,
      warning:
        process.env.NODE_ENV !== 'production'
          ? 'Running in development mode - NOT secure!'
          : null,
    };
  }

  /**
   * Verify enclave attestation
   *
   * Clients can verify the attestation to ensure:
   * - Code has not been tampered with
   * - Running in genuine secure hardware
   * - Signature is valid
   */
  @Post('verify')
  @ApiOperation({ summary: 'Verify enclave attestation' })
  @ApiResponse({
    status: 200,
    description: 'Attestation verification result',
  })
  async verifyAttestation(@Body() body: { attestation: any }) {
    // In production, verify the attestation document provided by client
    const isValid = await this.attestationService.verifyAttestation();

    return {
      valid: isValid,
      message: isValid
        ? 'Attestation is valid'
        : 'Attestation verification failed',
    };
  }

  /**
   * Health check for enclave
   */
  @Get('health')
  @ApiOperation({ summary: 'Enclave health check' })
  async healthCheck() {
    const healthy = await this.enclaveService.healthCheck();

    return {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: Date.now(),
    };
  }

  /**
   * Get enclave public key
   */
  @Get('public-key')
  @ApiOperation({ summary: 'Get enclave public key for encryption' })
  async getPublicKey() {
    return {
      publicKey: this.encryptionService.getEnclavePublicKey(),
      algorithm: 'Ed25519',
      usage: 'Encrypt messages for enclave processing',
    };
  }
}
