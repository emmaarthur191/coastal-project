import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'https://coastal-backend-annc.onrender.com';

// Security Headers & CSP
app.use((req, res, next) => {
    // Basic Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Strict Transport Security (HSTS)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // Content Security Policy (CSP)
    const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api2.amplitude.com https://browser.sentry-cdn.com https://js.sentry-cdn.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' " + BACKEND_URL + " https://api2.amplitude.com https://*.sentry.io https://*.ingest.sentry.io",
        "frame-src 'self'",
        "object-src 'none'",
        "base-uri 'self'"
    ];
    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

    next();
});

// Proxy API requests (HTTP)
const apiProxy = createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    secure: false,
    cookieDomainRewrite: {
        "*": "" // Rewrite all cookie domains to match the client's domain
    },
    pathRewrite: {
        '^/api': '/api'
    },
    on: {
        proxyReq: (proxyReq, req, res) => {
            // CRITICAL: Forward original Origin header for CSRF validation
            let origin = req.headers.origin;

            // If Origin is missing (sometimes on same-origin POSTs), try to extract from Referer
            if (!origin && req.headers.referer) {
                try {
                    const refererUrl = new URL(req.headers.referer);
                    origin = `${refererUrl.protocol}//${refererUrl.host}`;
                } catch (e) {
                    console.error('[Proxy] Failed to parse Referer for Origin:', e);
                }
            }

            if (origin) {
                proxyReq.setHeader('Origin', origin);
                proxyReq.setHeader('Referer', origin);
            }

            // Forward X-Forwarded headers for proper request context
            proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
            proxyReq.setHeader('X-Forwarded-Proto', 'https');

            console.log(`[Proxy API] ${req.method} ${req.path} -> ${BACKEND_URL}${req.path}`);
        },
        error: (err, req, res) => {
            console.error('[Proxy API Error]', err);
            if (res.writeHead) res.writeHead(500);
            if (res.end) res.end('Proxy Error');
        }
    }
});
app.use('/api', apiProxy);

// Proxy WebSocket requests
const wsProxy = createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    secure: false,
    ws: true, // Enable WebSocket proxying
    pathRewrite: {
        '^/ws': '/ws'
    },
    on: {
        proxyReqWs: (proxyReq, req, socket, options, head) => {
            console.log(`[Proxy WS] WebSocket upgrade: ${req.url} -> ${BACKEND_URL}${req.url}`);
        },
        error: (err, req, res) => {
            console.error('[Proxy WS Error]', err);
        }
    }
});
app.use('/ws', wsProxy);

// Serve Static Files with Explicit MIME Types
app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1y',
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// CRITICAL: Handle missing assets to prevent HTML fallback (MIME type error fix)
app.use('/assets/*', (req, res) => {
    console.warn(`[404] Missing asset requested: ${req.originalUrl}`);
    res.status(404).send('Asset not found');
});

// SPA Fallback (Rewrite all other requests to index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Create HTTP server and attach WebSocket upgrade handler
const server = createServer(app);
server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/ws')) {
        wsProxy.upgrade(req, socket, head);
    } else {
        socket.destroy();
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Proxying /api to ${BACKEND_URL}`);
    console.log(`Proxying /ws (WebSocket) to ${BACKEND_URL}`);
});
