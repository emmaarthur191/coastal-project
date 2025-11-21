#!/bin/bash

# Generate self-signed SSL certificate for development/testing
# In production, use Let's Encrypt or a proper CA

DOMAIN="yourdomain.com"
CERT_DIR="/etc/ssl/certs"
KEY_DIR="/etc/ssl/private"

# Create directories if they don't exist
sudo mkdir -p $CERT_DIR
sudo mkdir -p $KEY_DIR

# Generate private key
sudo openssl genrsa -out $KEY_DIR/$DOMAIN.key 2048

# Generate certificate signing request
sudo openssl req -new -key $KEY_DIR/$DOMAIN.key -out $CERT_DIR/$DOMAIN.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

# Generate self-signed certificate
sudo openssl x509 -req -days 365 -in $CERT_DIR/$DOMAIN.csr \
  -signkey $KEY_DIR/$DOMAIN.key -out $CERT_DIR/$DOMAIN.crt

echo "SSL certificate generated:"
echo "Certificate: $CERT_DIR/$DOMAIN.crt"
echo "Private Key: $KEY_DIR/$DOMAIN.key"
echo ""
echo "Update nginx.conf with these paths:"
echo "ssl_certificate $CERT_DIR/$DOMAIN.crt;"
echo "ssl_certificate_key $KEY_DIR/$DOMAIN.key;"