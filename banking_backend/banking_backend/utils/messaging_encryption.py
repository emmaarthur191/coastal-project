import base64
import hashlib
import secrets
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization


class MessagingEncryption:
    """Handle end-to-end encryption for staff messaging."""

    @staticmethod
    def generate_ecdh_keypair():
        """Generate ECDH key pair for a user."""
        private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
        public_key = private_key.public_key()

        # Serialize keys
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

        return private_pem, public_pem

    @staticmethod
    def derive_shared_secret(private_key_pem, peer_public_key_pem):
        """Derive shared secret using ECDH."""
        # Load private key
        private_key = serialization.load_pem_private_key(
            private_key_pem.encode('utf-8'),
            password=None,
            backend=default_backend()
        )

        # Load peer public key
        peer_public_key = serialization.load_pem_public_key(
            peer_public_key_pem.encode('utf-8'),
            backend=default_backend()
        )

        # Perform ECDH
        shared_key = private_key.exchange(ec.ECDH(), peer_public_key)

        # Derive symmetric key using HKDF
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'messaging-key',
            backend=default_backend()
        )

        return hkdf.derive(shared_key)

    @staticmethod
    def encrypt_message(plaintext, shared_secret):
        """Encrypt message using AES-GCM."""
        # Generate IV
        iv = secrets.token_bytes(12)

        # Create cipher
        cipher = Cipher(algorithms.AES(shared_secret), modes.GCM(iv), backend=default_backend())
        encryptor = cipher.encryptor()

        # Encrypt
        ciphertext = encryptor.update(plaintext.encode('utf-8')) + encryptor.finalize()

        # Get auth tag
        auth_tag = encryptor.tag

        return {
            'ciphertext': base64.b64encode(ciphertext).decode('utf-8'),
            'iv': base64.b64encode(iv).decode('utf-8'),
            'auth_tag': base64.b64encode(auth_tag).decode('utf-8')
        }

    @staticmethod
    def decrypt_message(encrypted_data, shared_secret):
        """Decrypt message using AES-GCM."""
        try:
            ciphertext = base64.b64decode(encrypted_data['ciphertext'])
            iv = base64.b64decode(encrypted_data['iv'])
            auth_tag = base64.b64decode(encrypted_data['auth_tag'])

            # Create cipher
            cipher = Cipher(algorithms.AES(shared_secret), modes.GCM(iv, auth_tag), backend=default_backend())
            decryptor = cipher.decryptor()

            # Decrypt
            plaintext = decryptor.update(ciphertext) + decryptor.finalize()

            return plaintext.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Decryption failed: {str(e)}")

    @staticmethod
    def encrypt_private_key(private_key_pem, password):
        """Encrypt private key with password-derived key."""
        # Derive key from password
        salt = secrets.token_bytes(16)
        kdf = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000, dklen=32)

        # Generate IV
        iv = secrets.token_bytes(12)

        # Encrypt
        cipher = Cipher(algorithms.AES(kdf), modes.GCM(iv), backend=default_backend())
        encryptor = cipher.encryptor()

        ciphertext = encryptor.update(private_key_pem.encode('utf-8')) + encryptor.finalize()
        auth_tag = encryptor.tag

        return {
            'encrypted_key': base64.b64encode(ciphertext).decode('utf-8'),
            'salt': base64.b64encode(salt).decode('utf-8'),
            'iv': base64.b64encode(iv).decode('utf-8'),
            'auth_tag': base64.b64encode(auth_tag).decode('utf-8')
        }

    @staticmethod
    def decrypt_private_key(encrypted_data, password):
        """Decrypt private key with password."""
        try:
            ciphertext = base64.b64decode(encrypted_data['encrypted_key'])
            salt = base64.b64decode(encrypted_data['salt'])
            iv = base64.b64decode(encrypted_data['iv'])
            auth_tag = base64.b64decode(encrypted_data['auth_tag'])

            # Derive key from password
            kdf = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000, dklen=32)

            # Decrypt
            cipher = Cipher(algorithms.AES(kdf), modes.GCM(iv, auth_tag), backend=default_backend())
            decryptor = cipher.decryptor()

            plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            return plaintext.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Private key decryption failed: {str(e)}")

    @staticmethod
    def hash_user_id(user_id):
        """Create a deterministic hash of user ID for key derivation."""
        return hashlib.sha256(str(user_id).encode()).hexdigest()

    @staticmethod
    def validate_key_format(key_pem, key_type='public'):
        """Validate PEM key format."""
        try:
            if key_type == 'public':
                serialization.load_pem_public_key(key_pem.encode('utf-8'), backend=default_backend())
            else:
                serialization.load_pem_private_key(key_pem.encode('utf-8'), password=None, backend=default_backend())
            return True
        except Exception:
            return False