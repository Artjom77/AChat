import RSA from 'react-native-rsa-native';
import CryptoJS from 'crypto-js';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KeyPair {
  public: string;
  private: string;
}

export interface EncryptedMessage {
  message: string;
  key: string;
}

export class EncryptionService {
  private static readonly KEY_SIZE = 2048;
  private static readonly PRIVATE_KEY_ALIAS = 'achat_private_key';
  private static readonly PUBLIC_KEY_ALIAS = 'achat_public_key';

  /**
   * Generate RSA key pair
   */
  static async generateKeyPair(): Promise<KeyPair> {
    try {
      const keys = await RSA.generateKeys(this.KEY_SIZE);

      // Store private key securely in Keychain
      await Keychain.setGenericPassword(
        this.PRIVATE_KEY_ALIAS,
        keys.private,
        {
          service: 'com.achat.keys',
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        }
      );

      // Store public key in AsyncStorage (not sensitive)
      await AsyncStorage.setItem(this.PUBLIC_KEY_ALIAS, keys.public);

      return keys;
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw error;
    }
  }

  /**
   * Get public key
   */
  static async getPublicKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.PUBLIC_KEY_ALIAS);
    } catch (error) {
      console.error('Failed to get public key:', error);
      return null;
    }
  }

  /**
   * Get private key from secure storage
   */
  static async getPrivateKey(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'com.achat.keys',
      });

      if (credentials && credentials.username === this.PRIVATE_KEY_ALIAS) {
        return credentials.password;
      }

      return null;
    } catch (error) {
      console.error('Failed to get private key:', error);
      return null;
    }
  }

  /**
   * Encrypt message using recipient's public key
   *
   * Uses hybrid encryption:
   * 1. Generate random AES key
   * 2. Encrypt message with AES (fast for large data)
   * 3. Encrypt AES key with RSA public key
   */
  static async encryptMessage(
    message: string,
    recipientPublicKey: string
  ): Promise<EncryptedMessage> {
    try {
      // 1. Generate random AES key (256 bits)
      const aesKey = CryptoJS.lib.WordArray.random(256 / 8).toString();

      // 2. Encrypt message with AES
      const encryptedMessage = CryptoJS.AES.encrypt(message, aesKey).toString();

      // 3. Encrypt AES key with RSA
      const encryptedKey = await RSA.encrypt(aesKey, recipientPublicKey);

      return {
        message: encryptedMessage,
        key: encryptedKey,
      };
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      throw error;
    }
  }

  /**
   * Decrypt message using own private key
   */
  static async decryptMessage(
    encryptedMessage: string,
    encryptedKey: string
  ): Promise<string> {
    try {
      // 1. Get private key
      const privateKey = await this.getPrivateKey();

      if (!privateKey) {
        throw new Error('Private key not found');
      }

      // 2. Decrypt AES key with RSA
      const aesKey = await RSA.decrypt(encryptedKey, privateKey);

      // 3. Decrypt message with AES
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, aesKey);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

      if (!plaintext) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }

      return plaintext;
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      throw error;
    }
  }

  /**
   * Hash password for local storage
   */
  static hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  /**
   * Generate message signature
   */
  static async signMessage(message: string): Promise<string> {
    try {
      const privateKey = await this.getPrivateKey();

      if (!privateKey) {
        throw new Error('Private key not found');
      }

      const signature = await RSA.sign(message, privateKey);
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }

  /**
   * Verify message signature
   */
  static async verifySignature(
    message: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      return await RSA.verify(signature, message, publicKey);
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return false;
    }
  }

  /**
   * Check if keys exist
   */
  static async hasKeys(): Promise<boolean> {
    const publicKey = await this.getPublicKey();
    const privateKey = await this.getPrivateKey();
    return publicKey !== null && privateKey !== null;
  }

  /**
   * Delete all keys (logout)
   */
  static async deleteKeys(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: 'com.achat.keys' });
      await AsyncStorage.removeItem(this.PUBLIC_KEY_ALIAS);
    } catch (error) {
      console.error('Failed to delete keys:', error);
    }
  }
}

export default EncryptionService;
