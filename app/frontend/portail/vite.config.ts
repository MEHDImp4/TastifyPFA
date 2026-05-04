import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { existsSync } from 'node:fs'

const sharedAlias = existsSync(fileURLToPath(new URL('./shared/auth/Login.tsx', import.meta.url)))
  ? './shared'
  : '../shared'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL(sharedAlias, import.meta.url)),
    },
    preserveSymlinks: true,
  },
  optimizeDeps: {
    include: ['zustand', 'axios', 'lucide-react'],
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
      allow: ['.'],
    },
  },
})
