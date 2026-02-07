### Story 7.2: Create App Icons and Manifest

**As a** user installing the PWA,
**I want** proper app icons and branding,
**So that** the app looks professional on my home screen.

**Acceptance Criteria:**

**Given** vite-plugin-pwa is configured (Story 7.1 complete)
**When** I generate app icons
**Then** all required icon sizes are created:

**Icon Requirements:**

* Base icon design: Coral (#E87461) background, white "D" symbol or flame emoji 🔥
* Icon sizes:
  * `icon-192.png` (192×192) - Android, Chrome
  * `icon-512.png` (512×512) - Android, splash screen
  * `icon-maskable.png` (512×512) - Android adaptive icon
  * `favicon.ico` (32×32, 16×16) - Browser tab
  * `apple-touch-icon.png` (180×180) - iOS home screen

**Maskable Icon:**

* Safe zone: Keep important content within center 80%
* Padding: Extra space around logo for Android adaptive icons
* Background: Solid coral color

**Manifest Updates** (`manifest.webmanifest`):

```json
{
  "name": "Discalculas - Dyscalculia Self-Therapy",
  "short_name": "Discalculas",
  "description": "Personalized math training for dyscalculia",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#E87461",
  "background_color": "#FFFFFF",
  "icons": [...]
}
```

**And** Meta tags in `index.html`:

```html
<meta name="theme-color" content="#E87461">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

**Prerequisites:** Story 7.1 (PWA config complete)

**Technical Notes:**

* Icon generation tool: Use Figma/Inkscape or online PWA icon generator
* Store icons in `public/icons/` directory
* Favicon: Multi-resolution `.ico` file (16px, 32px, 48px)
* Verify: Test installation on Android (Chrome) and iOS (Safari)
* Lighthouse audit: Check "Installable" criteria passes

***
