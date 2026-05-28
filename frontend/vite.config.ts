import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Proxy /api and /auth to the Express backend so session cookies stay
// same-origin in dev (avoids cross-site cookie friction).
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to 127.0.0.1 (not localhost) so the dev origin matches FRONTEND_URL
    // and the Spotify redirect host. Keeps the OAuth state cookie same-origin.
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/auth': { target: 'http://127.0.0.1:5000', changeOrigin: true },
    },
  },
})
