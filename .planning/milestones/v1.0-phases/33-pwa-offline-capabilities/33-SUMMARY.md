---
phase: 33
slug: pwa-offline-capabilities
status: complete
---

# Phase 33 Summary: PWA Offline Capabilities

## Work Completed

### 1. PWA Foundation
- Installed `vite-plugin-pwa` in both `backoffice` and `portail` SPAs.
- Created placeholder PWA icons (`icon.svg`) for branding and installation requirements.

### 2. Manifest Configuration
- Configured Web App Manifest for both frontends:
  - **Back-Office**: "Tastify ERP", landscape orientation, dark theme.
  - **Portail**: "Tastify", portrait orientation, mobile-first design.
- Verified manifest validity through production builds.

### 3. Offline Support & Workbox
- Configured Workbox caching strategies:
  - **Pre-caching**: Entire app shell (HTML, JS, CSS) cached for instant load.
  - **Runtime Caching**: Google Fonts and static media assets (menu images) cached with `CacheFirst` and `StaleWhileRevalidate` strategies.
- Implemented `ConnectivityBanner` in `@shared/components` to provide real-time visual feedback when the network is lost.
- Integrated the banner into the main entry points of both applications.

## Verification Results
- `npm run build` passes for both frontends.
- Service Worker (`sw.js`) and Manifest (`manifest.webmanifest`) correctly generated in `dist`.
- Application shell remains available offline (simulated via DevTools).

## Next Steps
- **Phase 34**: KDS Advanced Operations (UC19/UC20_bis).
