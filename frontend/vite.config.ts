import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  publicDir: 'public',
  build: {
    target: 'es2020',  // Modern browser target
    cssTarget: 'chrome80',
    rollupOptions: {
      output: {
        // Use hashed file names to prevent caching issues
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          // Core React libraries
          'vendor-react': ['react', 'react-dom'],
          // Routing
          'vendor-router': ['react-router-dom'],
          // State management and data fetching
          'vendor-query': ['@tanstack/react-query'],
          // Charts and visualizations
          'vendor-charts': ['recharts'],
          // UI components
          'vendor-ui': ['@headlessui/react', 'lucide-react'],
          // HTTP client
          'vendor-http': ['axios'],
          // Security and utilities
          'vendor-security': ['dompurify'],
          // Monitoring and analytics
          'vendor-monitoring': ['@sentry/browser', '@sentry/react', '@sentry/replay', 'amplitude-js'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,  // Disable sourcemaps in production for smaller bundles
  },
  server: {
    host: 'localhost',  // Only bind to localhost (not 0.0.0.0)
    port: 3000,
    strictPort: true,   // Fail if port 3000 is already in use
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 3000,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,  // HTTP only, no HTTPS
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    'process.env': {}
  }
})
