import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Support PR preview deployments with dynamic base path
  base: process.env.BASE_PATH || '/',
})
