import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'https://coastal-backend-annc.onrender.com';

// Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Proxy API requests
app.use('/api', createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    secure: false, // Don't verify self-signed certs (if any)
    pathRewrite: {
        '^/api': '/api' // Keep /api prefix
    },
    onProxyReq: (proxyReq, req, res) => {
        // Log proxy requests for debugging
        console.log(`[Proxy] ${req.method} ${req.path} -> ${BACKEND_URL}/api${req.path}`);
    },
    onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
        res.status(500).send('Proxy Error');
    }
}));

// Serve Static Files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback (Rewrite all other requests to index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Proxying /api to ${BACKEND_URL}`);
});
