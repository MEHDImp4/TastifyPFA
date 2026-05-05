import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
var __dirname = path.dirname(fileURLToPath(import.meta.url));
// Robust alias resolution for both local dev and docker
var getSharedPath = function () {
    var localShared = path.resolve(__dirname, 'shared');
    var parentShared = path.resolve(__dirname, '../shared');
    if (existsSync(path.join(localShared, 'auth/Login.tsx'))) {
        return localShared;
    }
    return parentShared;
};
var sharedPath = getSharedPath();
console.log('Using @shared path:', sharedPath);
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@shared': sharedPath,
        },
        preserveSymlinks: true,
    },
    optimizeDeps: {
        include: ['zustand', 'axios', 'lucide-react'],
    },
    server: {
        host: '0.0.0.0',
        port: 3000,
        strictPort: true,
        allowedHosts: true,
        proxy: {
            '/api': {
                target: 'http://backend:8000',
                changeOrigin: true,
            },
            '/ws': {
                target: 'http://backend:8000',
                ws: true,
                changeOrigin: true,
                rewrite: function (path) { return path; },
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
});
