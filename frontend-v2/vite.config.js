import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// UI-only v2 — no backend proxy. Pure mock-data prototype.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5174 },
});
