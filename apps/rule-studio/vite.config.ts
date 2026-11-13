import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@docteurflotte/decision-engine': path.resolve(__dirname, '../../packages/decision-engine/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
