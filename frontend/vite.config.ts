import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Development Proxy (Backend on port 8000)
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'http://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Production Build Configuration
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom'],

          // Routing
          'vendor-router': ['react-router-dom'],

          // State Management & Data Fetching
          'vendor-query': ['@tanstack/react-query'],

          // UI Library & Charts (Grouped for stability)
          'vendor-ui': ['lucide-react', 'recharts'],
        },
      },
    },
    // Increase chunk size warning limit to reduce noise
    chunkSizeWarningLimit: 800,
  },
});
