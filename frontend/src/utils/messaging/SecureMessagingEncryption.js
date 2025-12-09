// Enhanced Encryption with proper ECDH key exchange
class SecureMessagingEncryption {
  static async generateECDHKeypair() {
    try {
      console.log('[ENCRYPTION] Generating ECDH keypair...');
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-256',
        },
        true,
        ['deriveKey', 'deriveBits']
      );

      const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      const keypairData = {
        privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey))),
        publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
        keyPair
      };

      console.log('[ENCRYPTION] ECDH keypair generated successfully');
      return keypairData;
    } catch (error) {
      console.error('[ENCRYPTION] Error generating ECDH keypair:', error);
      throw new Error('Failed to generate encryption keys');
    }
  }

  static async deriveSharedSecret(privateKeyPem, peerPublicKeyPem) {
    try {
      console.log('[ENCRYPTION] Deriving shared secret...');

      // Import private key
      const privateKeyData = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));
      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyData,
        {
          name: 'ECDH',
          namedCurve: 'P-256',
        },
        false,
        ['deriveBits']
      );

      // Import peer public key
      const peerPublicKeyData = Uint8Array.from(atob(peerPublicKeyPem), c => c.charCodeAt(0));
      const peerPublicKey = await window.crypto.subtle.importKey(
        'spki',
        peerPublicKeyData,
        {
          name: 'ECDH',
          namedCurve: 'P-256',
        },
        false,
        []
      );

      // Derive shared secret
      const sharedSecret = await window.crypto.subtle.deriveBits(
        {
          name: 'ECDH',
          public: peerPublicKey,
        },
        privateKey,
        256
      );

      // Use HKDF to derive AES key
      const hkdfKey = await window.crypto.subtle.importKey(
        'raw',
        sharedSecret,
        'HKDF',
        false,
        ['deriveKey']
      );

      const aesKey = await window.crypto.subtle.deriveKey(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          salt: new Uint8Array(32), // Random salt for each conversation
          info: new TextEncoder().encode('secure-messaging-key'),
        },
        hkdfKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      );

      console.log('[ENCRYPTION] Shared secret derived successfully');
      return aesKey;
    } catch (error) {
      console.error('[ENCRYPTION] Error deriving shared secret:', error);
      throw new Error('Failed to derive encryption key');
    }
  }

  static async encryptMessage(plaintext, sharedSecret) {
    try {
      console.log('[ENCRYPTION] Encrypting message...');
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedPlaintext = new TextEncoder().encode(plaintext);

      const ciphertext = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        sharedSecret,
        encodedPlaintext
      );

      const encryptedContent = new Uint8Array(ciphertext);
      const authTag = encryptedContent.slice(-16);
      const encryptedData = encryptedContent.slice(0, -16);

      return {
        ciphertext: btoa(String.fromCharCode(...encryptedData)),
        iv: btoa(String.fromCharCode(...iv)),
        auth_tag: btoa(String.fromCharCode(...authTag)),
      };
    } catch (error) {
      console.error('[ENCRYPTION] Error encrypting message:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  static async decryptMessage(encryptedData, sharedSecret) {
    try {
      console.log('[DECRYPTION] Decrypting message...');
      const ciphertext = Uint8Array.from(atob(encryptedData.ciphertext), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
      const authTag = Uint8Array.from(atob(encryptedData.auth_tag), c => c.charCodeAt(0));

      // Combine ciphertext and auth tag
      const combined = new Uint8Array(ciphertext.length + authTag.length);
      combined.set(ciphertext);
      combined.set(authTag, ciphertext.length);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        sharedSecret,
        combined
      );

      const result = new TextDecoder().decode(decrypted);
      console.log('[DECRYPTION] Message decrypted successfully');
      return result;
    } catch (error) {
      console.error('[DECRYPTION] Error decrypting message:', error);
      throw new Error('Failed to decrypt message');
    }
  }
}

export default SecureMessagingEncryption;