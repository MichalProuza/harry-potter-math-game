import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  server: {
    // Při `npm run dev` posílá API požadavky na `wrangler dev` (port 8787).
    proxy: { '/api': 'http://localhost:8787' },
  },
});
