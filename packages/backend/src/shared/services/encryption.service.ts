import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Encryption Service - Phase 3
 * Handles encryption/decryption of sensitive data at the application level
 * Complements database-level encryption for defense in depth
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    // In production, retrieve from AWS KMS or HashiCorp Vault
    const keyEnv = this.configService.get<string>('ENCRYPTION_KEY');
    if (!keyEnv) {
      this.logger.warn(
        'ENCRYPTION_KEY not set - using development key. Use AWS KMS in production!',
      );
      // Development key - NEVER use in production
      this.encryptionKey = Buffer.from(
        'dev-encryption-key-32-bytes-long!!',
        'utf-8',
      ).slice(0, 32);
    } else {
      this.encryptionKey = Buffer.from(keyEnv, 'base64');
      if (this.encryptionKey.length !== 32) {
        throw new Error(
          'ENCRYPTION_KEY must be 32 bytes (256 bits) when base64 decoded',
        );
      }
    }
  }

  /**
   * Encrypt sensitive data (API keys, tokens, etc.)
   * @param plaintext Data to encrypt
   * @returns Base64 encoded ciphertext with IV and auth tag
   */
  encrypt(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(16); // Initialization vector
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Combine IV + ciphertext + authTag for storage
      const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex'), authTag]);
      return combined.toString('base64');
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param ciphertext Base64 encoded ciphertext with IV and auth tag
   * @returns Decrypted plaintext
   */
  decrypt(ciphertext: string): string {
    try {
      const combined = Buffer.from(ciphertext, 'base64');

      // Extract components
      const iv = combined.slice(0, 16);
      const authTag = combined.slice(combined.length - 16);
      const encrypted = combined.slice(16, combined.length - 16);

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf-8');
      decrypted += decipher.final('utf-8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (for comparison without storing plaintext)
   * @param plaintext Data to hash
   * @returns SHA-256 hash in hex format
   */
  hash(plaintext: string): string {
    return crypto.createHash('sha256').update(plaintext).digest('hex');
  }

  /**
   * Generate a secure random key
   * @param length Key length in bytes
   * @returns Base64 encoded key
   */
  generateKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Generate a secure random token
   * @param length Token length in bytes
   * @returns Hex encoded token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
