### Story 7.1: Configure vite-plugin-pwa and Service Worker

**As a** developer deploying the app,
**I want** service worker configured for offline support,
**So that** users can access the app even without internet connectivity.

**Acceptance Criteria:**

**Given** all previous epics are complete (Epics 1-6 done)
**When** I configure vite-plugin-pwa in the build process
**Then** the service worker is generated and registered:

**PWA Configuration** (`vite.config.ts`):

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Discalculas - Dyscalculia Self-Therapy',
        short_name: 'Discalculas',
        description: 'Personalized math training for dyscalculia',
        theme_color: '#E87461',  // Coral primary
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ]
});
```

**Caching Strategy:**

* Static assets: Cache-first (HTML, CSS, JS, images)
* API calls: Network-first with cache fallback (n/a for this app - local-only data)
* Runtime caching: Google Fonts, external resources

**Service Worker Registration:**

* Auto-registers on app load
* Shows update notification when new version available
* Toast: "New version available! Refresh to update."

**Prerequisites:** Epics 1-6 complete (all features ready for production)

**Technical Notes:**

* vite-plugin-pwa already installed in Epic 1 (Story 1.1)
* Service worker generated at build time: `npm run build`
* SW file: `dist/sw.js` (auto-generated)
* Registration: Auto-imported by plugin in `index.html`
* Test: Build production bundle, serve with `npm run preview`, verify SW registered
* Verify: Chrome DevTools > Application > Service Workers

***
