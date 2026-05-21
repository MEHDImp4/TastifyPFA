# Design System: Tastify PFA

## 1. Visual Theme & Atmosphere
Tastify PFA is a high-end restaurant OS that balances **Tactical Command** (for staff efficiency) with **Organic Sophistication** (for client elegance). 

- **Atmosphere:** A curated digital concierge. It feels like a well-lit architecture studio or a luxury hotel’s command center. It is clinical yet warm, prioritizing "Absolute Visibility" through high contrast and bold typography.
- **Density:** 4 (Gallery Airy) for Client Portal; 8 (Cockpit Dense) for Staff Backoffice.
- **Variance:** 8 (Offset Asymmetric) to avoid the "generic dashboard" look.
- **Motion:** 6 (Fluid CSS) with weighty spring physics.

## 2. Color Palette & Roles
The palette is sun-drenched and heritage-inspired.

- **Parchment Canvas** (`#fff8f5`) — Primary background surface. Warm, paper-like.
- **Roasted Ink** (`#301400`) — Primary text and functional elements. **Must be used for all critical labels.**
- **Sienna Primary** (`#8d4e1c`) — Brand focus, primary CTAs, active states.
- **Amber Accent** (`#8f4d17`) — Status differentiation, warnings, and secondary highlights.
- **Terracotta Container** (`#ffeade`) — Subtle layering for cards and structural zones.
- **Error Crimson** (`#ba1a1a`) — Critical alerts and destructive actions.

## 3. Typography Rules
- **Display (Headlines):** `Libre Caslon Text`. Use for brand moments and section headers. High-end, editorial feel.
- **Body:** `Bodoni Moda`. Used for descriptions and long-form content. 65ch max-width.
- **Data (Labels/UI):** `Bricolage Grotesque`. Used for all technical UI, buttons, and numbers. **Mandate:** High tracking (`0.25em`) for uppercase labels.
- **Monospace:** `JetBrains Mono`. Used for technical metadata and code snippets.
- **Anti-Pattern:** `Inter` is strictly BANNED. Generic serifs are BANNED.

## 4. Component Stylings
- **Buttons:** Tactile, rounded (8px). Primary buttons in Sienna with Ink or White text. No outer glows.
- **Cards:** Generously rounded (16px). Use tonal fills (`#ffeade`) instead of shadows for hierarchy. In dense staff views, use 1px dividers in `#867369` instead of cards.
- **Inputs:** Label above (Bricolage Grotesque, Bold). 1px bottom border in Sienna. No floating labels.
- **Status Badges:** Softly rounded rectangles. High-contrast text on tonal backgrounds.
- **Table Map:** Geometric architectural primitives. Tables use tonal spotting (Sienna/Amber/Parchment).

## 5. Layout Principles
- **No Overlapping:** Every element occupies its own clear spatial zone.
- **Asymmetric Hero:** Client pages must use offset layouts, never centered.
- **Staff Density:** Staff pages (KDS, Salle) use a "Cockpit" layout—information is dense but organized by rigid 8px rhythmic units.
- **Absolute Visibility:** Functional pages (Login, KDS, Dashboard) MUST use bold weights and high-contrast colors (`#301400` on `#fff8f5`).

## 6. Technical Specifications (Tokens)

### 6.1. Typography Scale
| Token | Font Family | Size | Weight | Line Height | Letter Spacing |
|-------|-------------|------|--------|-------------|----------------|
| `display-lg` | Libre Caslon Text | 64px | 700 | 1.1 | -0.02em |
| `display-lg-mobile` | Libre Caslon Text | 40px | 700 | 1.2 | - |
| `headline-md` | Libre Caslon Text | 32px | 600 | 1.3 | - |
| `body-lg` | Bodoni Moda | 18px | 400 | 1.6 | - |
| `body-md` | Bodoni Moda | 16px | 400 | 1.5 | - |
| `ui-label-bold` | Bricolage Grotesque | 14px | 800 | 1.2 | 0.25em |
| `ui-button` | Bricolage Grotesque | 14px | 700 | 1.0 | 0.05em |
| `ui-data-dense` | Bricolage Grotesque | 13px | 600 | 1.0 | - |

### 6.2. Spacing & Rhythm
- `unit-xs`: 4px
- `unit-sm`: 8px
- `unit-md`: 16px
- `unit-lg`: 24px
- `staff-gutter`: 1rem (16px)
- `staff-margin`: 1.5rem (24px)
- `client-gutter`: 3rem (48px)
- `client-margin`: 5vw

### 6.3. Corner Roundness
- `ROUND_FOUR`: 0.25rem (4px)
- `ROUND_EIGHT`: 0.5rem (8px) - **Default for Components**
- `ROUND_TWELVE`: 0.75rem (12px) - **Default for Cards**
- `ROUND_FULL`: 9999px

## 7. Motion & Interaction
- **Spring Physics:** Weighty feel (`stiffness: 100, damping: 20`).
- **Cascade Reveals:** Staggered entry for list items and menu cards.
- **Micro-Loops:** Real-time indicators (WebSocket pulse) should have a perpetual subtle shimmer.
- **Performance:** Animate exclusively via `transform` and `opacity`.

## 8. Anti-Patterns (Banned AI "Slop")
- **No Emojis.**
- **No `Inter` font.**
- **No Pure Black (`#000000`).**
- **No Neon or Outer Glow shadows.**
- **No Centered Hero sections.**
- **No AI Copywriting Clichés** ("Elevate", "Seamless", "Unleash").
- **No Generic Placeholder Names** (Use "Table 12", "Filet Mignon", "Chef Marc").
- **No Blur Animations** on critical functional content.

---

## 8. Screen Directives (Stitch Prompting Guide)

### 8.1. Staff Backoffice (Tactical Command)
1. **KDS (Kitchen Display System):** A high-density grid of order cards. Each card shows table number, waiter name, and a list of dishes with checkboxes. A countdown timer (`heure_lancement`) glows amber if over 10 minutes.
2. **Salle Map:** A clean, architectural top-down view of the restaurant. Tables are circles and squares. Color-code: Sienna (Occupied), Parchment (Free), Amber (Reserved).
3. **Ordering Page:** Split-screen. Left: Categories & Dishes (Large touch-targets). Right: Current ticket with "FIRE" button.
4. **Staff Dashboard:** Bento-grid layout with real-time analytics (Revenue, Table Turnover, Top Dishes).

### 8.2. Client Portal (Organic Sophistication)
1. **Portal Home:** A high-end editorial landing page. Large serif typography, asymmetric layouts, and deep parchment tones.
2. **Digital Menu:** A visually rich grid of dishes. Large photos, elegant `Bodoni Moda` descriptions, and a minimalist "Add" button.
3. **Reservation Wizard:** A calm, multi-step flow. Step 1: Date/Time (Grid of chips). Step 2: Party Size. Step 3: Confirmation.
4. **Payment/Checkout:** A secure, high-contrast summary of the order with "Split Bill" options.
