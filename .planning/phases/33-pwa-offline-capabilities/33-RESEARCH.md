---
phase: 33
slug: pwa-offline-capabilities
status: research
---

# Phase 33 Research: PWA with Vite

## Library: vite-plugin-pwa
- **Doc**: [https://vite-pwa-org.netlify.app/](https://vite-pwa-org.netlify.app/)
- **Installation**: `npm add -D vite-plugin-pwa`
- **Features**:
  - Automatic Service Worker registration.
  - Manifest generation.
  - Development mode support.
  - Workbox integration for sophisticated caching.

## Manifest Configuration
Required fields for PWA:
- `name`, `short_name`
- `description`
- `theme_color`, `background_color`
- `icons`: Need at least 192x192 and 512x512.
- `display`: `standalone`
- `start_url`: `/`

## Offline Strategies
1.  **Stale-While-Revalidate**: For assets that change but should be fast.
2.  **Cache First**: For static assets (images, fonts).
3.  **Network First**: For API calls (with offline fallback).

## Icons
Since I don't have real icons, I'll generate SVGs and use a tool to convert them or just use high-res SVGs in the manifest if supported (Chrome supports SVG icons).

## Background Sync (Future)
Background Sync API allows queuing requests while offline and playing them back when online.
- Useful for: Marking an order as "Ready" in KDS if WiFi drops.
- Complexity: Requires indexedDB for queuing and a logic to handle conflicts.
- **Decision**: Deferred to Phase 34/39. Phase 33 will focus on "Shell Offline" (loading the app).
