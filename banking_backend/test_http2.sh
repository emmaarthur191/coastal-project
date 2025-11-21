#!/bin/bash

# Test HTTP/2 functionality
DOMAIN="yourdomain.com"
URL="https://$DOMAIN"

echo "Testing HTTP/2 support for $URL"

# Check if curl supports HTTP/2
if curl --version | grep -q "HTTP2"; then
    echo "Curl supports HTTP/2"
else
    echo "Curl does not support HTTP/2. Install a version that does."
    exit 1
fi

# Test HTTP/2 connection
echo "Testing HTTP/2 connection..."
RESPONSE=$(curl -I --http2 -k $URL 2>/dev/null)

if echo "$RESPONSE" | grep -q "HTTP/2"; then
    echo " HTTP/2 is working"
else
    echo " HTTP/2 is not working"
    echo "Response headers:"
    echo "$RESPONSE"
fi

# Test if site is accessible
STATUS=$(curl -k --http2 -s -o /dev/null -w "%{http_code}" $URL)
if [ "$STATUS" -eq 200 ]; then
    echo " Site is accessible (HTTP $STATUS)"
else
    echo " Site returned HTTP $STATUS"
fi

echo ""
echo "If HTTP/2 is not working:"
echo "1. Ensure SSL certificates are properly installed"
echo "2. Check nginx configuration for 'http2' directive"
echo "3. Verify firewall allows port 443"
echo "4. Check nginx error logs: sudo nginx -t && sudo systemctl reload nginx"