import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
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
export default defineConfig({
    define: {
        'import.meta.env.VITE_AUTH_PORTAL': JSON.stringify('staff'),
    },
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'icon.svg'],
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            },
            manifest: {
                name: 'Tastify ERP',
                short_name: 'TastifyStaff',
                description: 'Operational Dashboard for Tastify ERP (Salle & KDS)',
                theme_color: '#2563eb',
                background_color: '#0f172a',
                icons: [
                    {
                        src: 'icon.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml'
                    },
                    {
                        src: 'icon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml'
                    }
                ],
                display: 'standalone',
                orientation: 'landscape'
            }
        })
    ],
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
        port: 3000,
        strictPort: true,
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
        fs: {
            allow: [
                '.',
                sharedPath
            ],
        },
    },
});
