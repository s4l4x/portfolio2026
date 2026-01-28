import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Support PR preview deployments with dynamic base path
  base: process.env.BASE_PATH || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Replace leva with a no-op stub in production
      ...(mode === 'production' && {
        leva: path.resolve(__dirname, 'src/lib/leva-stub.ts'),
      }),
    },
  },
}))
