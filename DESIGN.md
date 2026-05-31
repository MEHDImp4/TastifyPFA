# Design System: Tastify Premium Minimalist

## 1. Visual Theme & Atmosphere
The interface is a "Digital Atelier"—a restrained, gallery-airy environment that prioritizes content over chrome. It moves away from flashy gradients and loud colors toward a high-contrast, monochromatic aesthetic. The mood is clinical yet warm, utilizing massive whitespace, strict geometric grids, and a single-weight typographic hierarchy. 

**Key Philosophy:** "Quiet Sophistication." If an element doesn't serve a functional purpose, it is removed. Depth is created through tonal layering and 1px borders, never shadows.

## 2. Color Palette & Roles
- **Canvas Bone** (`#FBFBFA`) — Primary background surface.
- **Pure Surface** (`#FFFFFF`) — Card and container fill.
- **Charcoal Ink** (`#111111`) — Primary text, buttons, and functional elements.
- **Zinc Muted** (`#71717A`) — Secondary text, metadata, and descriptions.
- **Atelier Border** (`#EAEAEA`) — The primary structural element. Used for cards, dividers, and inputs.
- **Highlight (Optional)** (`#111111`) — No accent color. Visual interest is achieved through typography and photography.

## 3. Typography Rules
- **Primary Sans (UI/Body):** `Geist Sans` or `Public Sans`. Clean, geometric, neutral.
- **Editorial Serif (Headlines):** `Newsreader` or `Instrument Serif`. Used sparingly for high-level headings. No italics unless strictly required for emphasis.
- **Mono (Technical):** `Geist Mono` or `JetBrains Mono`. For prices, timestamps, and status labels.
- **Anti-Patterns:** BANNED: Inter, extra-bold weights (>700), and massive italic headlines (>64px).

## 4. Component Stylings
- **Buttons:** Solid Charcoal background with Bone text. Sharp 4px or 6px radius. No shadows. Micro-scale `scale(0.98)` on click.
- **Cards:** White background with a `1px solid #EAEAEA` border. Radius is a consistent `12px`. Padding is massive (`py-12 px-10`).
- **Inputs:** Simple `1px` border that shifts to Charcoal on focus. No outer glows or ring offsets.
- **Icons:** Ultra-light stroke (1px). Standardize on Phosphor Light or Lucide with `strokeWidth={1}`.

## 5. Layout Principles
- **Macro-Whitespace:** Massive vertical gaps between sections (minimum `py-32`).
- **The Bento Grid:** Use asymmetrical CSS Grid for feature sections. Every element must occupy its own clear spatial zone.
- **Absolute Visibility:** 100% opacity for all text. No blurs on functional content. 
- **Containment:** Main content width limited to `1200px` for optimal readability.

## 6. Motion & Interaction
- **Fade-Up Entrance:** Subtle `opacity: 0` + `translateY(10px)` resolving over `600ms`.
- **No Flashy Effects:** BANNED: Pulse, shimmer, and spinning icons.
- **Spring Physics:** Weighty feel (`stiffness: 100, damping: 20`).

## 7. Anti-Patterns (BANNED)
- No Emojis.
- No Burnt Orange, Gold, or AI-Purple.
- No Shadows (shadow-sm/md/lg/xl).
- No Centered Hero sections (prefer left-aligned or split).
- No "Liquid Glass" or "Glassmorphism."
- No AI Clichés ("Elevate", "Next-Gen").
- No generic placeholder names.
- No custom mouse cursors.
