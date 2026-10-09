import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5175,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'https://akugawe-portal.pages.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'https://akugawe-portal.pages.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
