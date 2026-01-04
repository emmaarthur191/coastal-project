/**
 * MessagingEncryption class for end-to-end encryption of messages
 * Uses Web Crypto API for client-side encryption/decryption
 * Implements ECDH key exchange and AES-GCM encryption
 */
class MessagingEncryption {
  constructor() {
    this.keyPair = null;
    this.sharedSecrets = new Map(); // Cache for shared secrets with other users
    this.publicKeys = new Map(); // Cache for other users' public keys
  }

  /**
   * Generate ECDH key pair for the current user
   * @returns {Promise<CryptoKeyPair>} The generated key pair
   */
  async generateKeyPair() {
    try {
      this.keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        true, // extractable
        ['deriveKey', 'deriveBits']
      );
      return this.keyPair;
    } catch (error) {
      console.error('Error generating key pair:', error);
      throw new Error('Failed to generate encryption keys');
    }
  }

  /**
   * Export public key as base64 string for sharing
   * @returns {Promise<string>} Base64 encoded public key
   */
  async exportPublicKey() {
    if (!this.keyPair) {
      await this.generateKeyPair();
    }

    try {
      const exported = await crypto.subtle.exportKey('spki', this.keyPair.publicKey);
      return this.arrayBufferToBase64(exported);
    } catch (error) {
      console.error('Error exporting public key:', error);
      throw new Error('Failed to export public key');
    }
  }

  /**
   * Import a public key from base64 string
   * @param {string} base64Key - Base64 encoded public key
   * @returns {Promise<CryptoKey>} Imported public key
   */
  async importPublicKey(base64Key) {
    try {
      const keyData = this.base64ToArrayBuffer(base64Key);
      return await crypto.subtle.importKey(
        'spki',
        keyData,
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        true,
        []
      );
    } catch (error) {
      console.error('Error importing public key:', error);
      throw new Error('Failed to import public key');
    }
  }

  /**
   * Derive shared secret using ECDH with another user's public key
   * @param {CryptoKey} otherPublicKey - The other user's public key
   * @param {string} userId - The other user's ID for caching
   * @returns {Promise<CryptoKey>} Derived AES key
   */
  async deriveSharedSecret(otherPublicKey, userId) {
    if (!this.keyPair) {
      await this.generateKeyPair();
    }

    // Check cache first
    if (this.sharedSecrets.has(userId)) {
      return this.sharedSecrets.get(userId);
    }

    try {
      const sharedSecret = await crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: otherPublicKey
        },
        this.keyPair.privateKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Cache the shared secret
      this.sharedSecrets.set(userId, sharedSecret);
      return sharedSecret;
    } catch (error) {
      console.error('Error deriving shared secret:', error);
      throw new Error('Failed to derive shared secret');
    }
  }

  /**
   * Encrypt a message using AES-GCM
   * @param {string} message - Plain text message
   * @param {CryptoKey} sharedSecret - AES key for encryption
   * @returns {Promise<string>} Encrypted message as base64 string
   */
  async encryptMessage(message, sharedSecret) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      // Generate a random IV for each message
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        sharedSecret,
        data
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('Error encrypting message:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt a message using AES-GCM
   * @param {string} encryptedMessage - Base64 encoded encrypted message
   * @param {CryptoKey} sharedSecret - AES key for decryption
   * @returns {Promise<string>} Decrypted plain text message
   */
  async decryptMessage(encryptedMessage, sharedSecret) {
    try {
      const combined = this.base64ToArrayBuffer(encryptedMessage);
      const combinedArray = new Uint8Array(combined);

      // Extract IV (first 12 bytes) and encrypted data
      const iv = combinedArray.slice(0, 12);
      const encrypted = combinedArray.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        sharedSecret,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Error decrypting message:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Encrypt a message for a specific user
   * @param {string} message - Plain text message
   * @param {string} recipientId - Recipient user ID
   * @returns {Promise<string>} Encrypted message
   */
  async encryptMessageForUser(message, recipientId) {
    const publicKey = this.publicKeys.get(recipientId);
    if (!publicKey) {
      throw new Error(`No public key available for user ${recipientId}`);
    }

    const sharedSecret = await this.deriveSharedSecret(publicKey, recipientId);
    return await this.encryptMessage(message, sharedSecret);
  }

  /**
   * Decrypt a message from a specific user
   * @param {string} encryptedMessage - Encrypted message
   * @param {string} senderId - Sender user ID
   * @returns {Promise<string>} Decrypted message
   */
  async decryptMessageFromUser(encryptedMessage, senderId) {
    const publicKey = this.publicKeys.get(senderId);
    if (!publicKey) {
      throw new Error(`No public key available for user ${senderId}`);
    }

    const sharedSecret = await this.deriveSharedSecret(publicKey, senderId);
    return await this.decryptMessage(encryptedMessage, sharedSecret);
  }

  /**
   * Store a user's public key
   * @param {string} userId - User ID
   * @param {string} publicKeyBase64 - Base64 encoded public key
   */
  async storePublicKey(userId, publicKeyBase64) {
    try {
      const publicKey = await this.importPublicKey(publicKeyBase64);
      this.publicKeys.set(userId, publicKey);
    } catch (error) {
      console.error('Error storing public key:', error);
      throw new Error('Failed to store public key');
    }
  }

  /**
   * Check if we have a public key for a user
   * @param {string} userId - User ID
   * @returns {boolean} Whether we have the public key
   */
  hasPublicKey(userId) {
    return this.publicKeys.has(userId);
  }

  /**
   * Clear all cached keys (useful for logout)
   */
  clearKeys() {
    this.keyPair = null;
    this.sharedSecrets.clear();
    this.publicKeys.clear();
  }

  /**
   * Utility: Convert ArrayBuffer to base64 string
   * @param {ArrayBuffer} buffer - ArrayBuffer to convert
   * @returns {string} Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Convert base64 string to ArrayBuffer
   * @param {string} base64 - Base64 string to convert
   * @returns {ArrayBuffer} ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate a password-based key for additional security (optional)
   * @param {string} password - User password
   * @param {string} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>} Derived key
   */
  async deriveKeyFromPassword(password, salt) {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode(salt),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Error deriving key from password:', error);
      throw new Error('Failed to derive key from password');
    }
  }
}

// Export singleton instance
export const messagingEncryption = new MessagingEncryption();
export default MessagingEncryption;
