import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/auth/google': 'http://localhost:5000',
      '/auth/facebook': 'http://localhost:5000'
    }
  }
})
