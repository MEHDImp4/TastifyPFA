import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Robust alias resolution for both local dev and docker
const getSharedPath = () => {
  const localShared = path.resolve(__dirname, 'shared')
  const parentShared = path.resolve(__dirname, '../shared')
  
  if (existsSync(path.join(localShared, 'auth/Login.tsx'))) {
    return localShared
  }
  return parentShared
}

const sharedPath = getSharedPath()
console.log('Using @shared path:', sharedPath)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': sharedPath,
    },
  },
  optimizeDeps: {
    include: ['zustand', 'axios', 'lucide-react', 'react-router-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: 3003,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
    },
    fs: {
      allow: [
        '.',
        sharedPath
      ],
    },
  },
})
