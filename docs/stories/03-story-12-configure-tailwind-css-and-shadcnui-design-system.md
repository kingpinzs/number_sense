### Story 1.2: Configure Tailwind CSS and shadcn/ui Design System

**As a** developer,
**I want** Tailwind CSS v4 and shadcn/ui configured with the Balanced Warmth color theme,
**So that** I can build mobile-first, accessible UI components matching the UX specification.

**Acceptance Criteria:**

**Given** the Vite project is initialized (Story 1.1 complete)
**When** I configure Tailwind and shadcn/ui
**Then** the following are successfully set up:

* Tailwind CSS v4 installed and PostCSS configured
* `tailwind.config.js` includes Balanced Warmth color palette:
  * Primary: `#E87461` (coral)
  * Secondary: `#A8E6CF` (mint)
  * Accent: `#FFD56F` (yellow)
  * Success: `#66BB6A`
  * Warning: `#FFB74D`
  * Error: `#EF5350`
* Responsive breakpoints configured: mobile (320px), tablet (768px), desktop (1024px)
* shadcn/ui initialized with `npx shadcn@latest init`
* Base components installed: button, card, sheet, toast, progress, form

**And** `src/styles/globals.css` includes Tailwind directives and custom theme variables
**And** A test component using `className="bg-primary text-white"` renders with coral background
**And** Dark mode setup prepared (CSS variables defined, implementation deferred)

**Prerequisites:** Story 1.1 (Vite project initialized)

**Technical Notes:**

* Follow [ux-design-specification.md](./ux-design-specification.md) color palette section
* Configure Tailwind with 8px spacing scale (`spacing: { 1: '8px', 2: '16px', ... }`)
* Set up Inter font family as primary typography
* shadcn/ui components should use `@/components/ui/` path
* Verify mobile-first responsive classes work (`sm:`, `md:`, `lg:` breakpoints)

***
