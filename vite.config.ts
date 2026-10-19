import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the app from /<repo-name>/. Override with VITE_BASE_PATH for other hosts.
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // `npm run dev`: requests to /api go to the local backend, so the browser only talks to this server.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
