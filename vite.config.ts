import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'jotai'],
          charts: ['lightweight-charts'],
          vendor: ['axios', 'dayjs', 'decimal.js', 'react-window'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://data-api.binance.vision',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // Remove rewrite to keep /api prefix
      },
    },
  },
});
