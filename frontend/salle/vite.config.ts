import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      'axios': fileURLToPath(new URL('./node_modules/axios', import.meta.url)),
      'zustand': fileURLToPath(new URL('./node_modules/zustand', import.meta.url)),
      'lucide-react': fileURLToPath(new URL('./node_modules/lucide-react', import.meta.url)),
    },
    preserveSymlinks: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    strictPort: true,
    allowedHosts: ['localhost', 'salle', 'nginx'],
    hmr: {
      clientPort: 80,
    },
    watch: {
      usePolling: true,
    },
  },
})
