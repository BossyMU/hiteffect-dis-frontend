import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Each Vercel project says which environment it builds (production or uat), so the site talks to
// the right backend. Fail the build rather than guess.
if (process.env.VERCEL && !['production', 'uat'].includes(process.env.VITE_APP_ENV ?? '')) {
  throw new Error('Set VITE_APP_ENV to "production" or "uat" on the Vercel project')
}

// https://vite.dev/config/
export default defineConfig({
  // Served from the root of its domain. VITE_BASE_PATH is for hosting under a sub-path.
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
