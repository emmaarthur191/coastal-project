const crypto = require('crypto');

// Generate secure encryption key (32 bytes for Fernet, base64url encoded)
const encryptionKey = crypto.randomBytes(32).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

// Generate secure salt (16 bytes for PBKDF2, base64url encoded)
const encryptionSalt = crypto.randomBytes(16).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

console.log('=== PRODUCTION ENCRYPTION KEYS ===');
console.log('ENCRYPTION_KEY=' + encryptionKey);
console.log('ENCRYPTION_SALT=' + encryptionSalt);
console.log('=================================');
console.log('');
console.log('Add these to your production environment variables:');
console.log('export ENCRYPTION_KEY="' + encryptionKey + '"');
console.log('export ENCRYPTION_SALT="' + encryptionSalt + '"');

// Write to .env.production file
const fs = require('fs');
const envContent = `ENCRYPTION_KEY=${encryptionKey}
ENCRYPTION_SALT=${encryptionSalt}`;

fs.writeFileSync('banking_backend/.env.production', envContent);
console.log('');
console.log('Created banking_backend/.env.production file with the keys');