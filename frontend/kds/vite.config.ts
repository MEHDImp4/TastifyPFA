import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../_shared', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3002,
    strictPort: true,
    allowedHosts: ['localhost', 'kds', 'nginx'],
    hmr: {
      clientPort: 80,
    },
    watch: {
      usePolling: true,
    },
  },
})
