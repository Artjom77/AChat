/**
 * @achat/crypto
 * Cryptographic utilities for AChat
 */

import * as crypto from 'crypto';
import { KeyPair, EncryptedPayload } from '@achat/types';

const ALGORITHM = 'aes-256-gcm';
const KEY_SIZE = 32; // 256 bits
const IV_SIZE = 16; // 128 bits

/**
 * Generate Ed25519 key pair for user
 */
export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

  return {
    publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
  };
}

/**
 * Generate random session key
 */
export function generateSessionKey(): Buffer {
  return crypto.randomBytes(KEY_SIZE);
}

/**
 * Generate random IV
 */
export function generateIV(): Buffer {
  return crypto.randomBytes(IV_SIZE);
}

/**
 * Encrypt data with AES-256-GCM
 */
export function encrypt(plaintext: string, key: Buffer): EncryptedPayload {
  const iv = generateIV();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    encryptedKey: '', // Will be set after encrypting the key
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    timestamp: Date.now(),
  };
}

/**
 * Decrypt data with AES-256-GCM
 */
export function decrypt(payload: EncryptedPayload, key: Buffer): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(payload.iv, 'base64'),
  );

  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

  let decrypted = decipher.update(payload.encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash password with bcrypt-compatible algorithm
 */
export function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512');
  return `${actualSalt}:${hash.toString('hex')}`;
}

/**
 * Verify password hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, originalHash] = hashedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

/**
 * Generate secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Calculate SHA-256 hash
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Sign data with private key
 */
export function sign(data: string, privateKeyBase64: string): string {
  const privateKey = crypto.createPrivateKey({
    key: Buffer.from(privateKeyBase64, 'base64'),
    format: 'der',
    type: 'pkcs8',
  });

  const signature = crypto.sign(null, Buffer.from(data), privateKey);
  return signature.toString('base64');
}

/**
 * Verify signature with public key
 */
export function verify(
  data: string,
  signatureBase64: string,
  publicKeyBase64: string,
): boolean {
  const publicKey = crypto.createPublicKey({
    key: Buffer.from(publicKeyBase64, 'base64'),
    format: 'der',
    type: 'spki',
  });

  const signature = Buffer.from(signatureBase64, 'base64');

  return crypto.verify(null, Buffer.from(data), publicKey, signature);
}
