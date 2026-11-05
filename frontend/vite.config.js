import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { authServerPlugin } from './vite-auth-plugin.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), authServerPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
      }
    }
  }
});
