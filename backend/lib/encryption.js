const crypto = require('crypto');

/**
 * Encryption service for storing sensitive credentials
 * Uses AES-256-GCM encryption
 */
class EncryptionService {
  constructor() {
    // In production, this should come from environment variables
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Encrypt data
   * @param {string} plainText - Data to encrypt
   * @returns {Object} - Encrypted data with iv and authTag
   */
  encrypt(plainText) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data
   * @param {Object} encryptedData - Object with encrypted, iv, and authTag
   * @returns {string} - Decrypted plaintext
   */
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash data (one-way)
   * @param {string} data - Data to hash
   * @returns {string} - Hashed data
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify hashed data
   * @param {string} data - Original data
   * @param {string} hash - Hash to compare against
   * @returns {boolean} - True if match
   */
  verifyHash(data, hash) {
    return this.hash(data) === hash;
  }
}

module.exports = new EncryptionService();
