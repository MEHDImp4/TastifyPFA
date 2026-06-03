---
phase: 33
slug: pwa-offline-capabilities
status: discussion
---

# Phase 33: PWA Offline Capabilities

## Goal
Transform the operational frontends (Salle, KDS) and the Portail Client into Progressive Web Apps (PWA) with basic offline support.

## Context
Tastify is used in high-intensity operational environments (Kitchen, Salle). Network hiccups should not crash the UI or prevent basic interactions.
The roadmap specifically mentions Salle & KDS (Back-Office SPA), but the Portail Client (Client SPA) also benefits from PWA for speed and "App-like" feel on mobile.

## Proposed Scope
1.  **Library**: Use `vite-plugin-pwa` for both SPAs.
2.  **Manifest**:
    *   `name`: Tastify ERP (Staff) / Tastify (Client)
    *   `short_name`: Tastify
    *   `theme_color`: #2563eb (Primary Blue)
    *   `background_color`: #0f172a (Dark Surface)
    *   `display`: standalone
    *   `orientation`: portrait (Client) / landscape (Staff)
3.  **Service Worker**:
    *   `registerType`: 'autoUpdate'
    *   `workbox`: Cache static assets (CSS, JS, Fonts).
4.  **Offline Support**:
    *   Offline fallback page or toast notification when network is lost.
    *   Caching the shell so the app loads even without internet.

## Questions for Discussion
- [ ] Should we implement "Background Sync" for order updates if the network drops momentarily? (Maybe too complex for this phase, keep for Phase 34/39?).
- [ ] Do we need specific icons? (I'll generate basic placeholders for now).

## Success Criteria
1.  Chrome "Install" icon appears in the address bar.
2.  App loads when disconnected from internet (shell caching).
3.  Lighthouse PWA score > 80.
