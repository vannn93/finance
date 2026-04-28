import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:5000',
      '/api': 'http://localhost:5000',
      '/transactions': 'http://localhost:5000',
      '/upload': 'http://localhost:5000',
      '/qr': 'http://localhost:5000',
    }
  }
})
