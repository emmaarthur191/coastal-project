import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 3000,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', 'lucide-react', 'recharts'],
          utils: ['axios', 'dompurify', 'react-router-dom'],
          monitoring: ['@sentry/browser', '@sentry/react', 'amplitude-js'],
        },
      },
    },
  },
  define: {
    'process.env': {}
  }
})