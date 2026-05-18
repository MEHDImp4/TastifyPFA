# Design System: Tastify Landing Redesign

## 1. Visual Theme & Atmosphere
A high-energy, cinematic "Bento-Command" interface. The atmosphere fuses high-end editorial elegance with tactical precision. It uses **Extreme Asymmetry** and **Scale Contrast** to create visual tension and attract immediate attention. The motion is weighted and deliberate, using spring physics for every interaction.

## 2. Color Palette & Roles
- **Canvas Cream** (#FDF8F4) — Primary background surface
- **Roasted Espresso** (#1C140E) — Primary text and dark sections
- **Burnt Sienna** (#D1854E) — Primary accent, CTAs, and focal points
- **Soft Parchment** (#F5E6D8) — Secondary surface, card backgrounds
- **Ethereal Glass** (rgba(255, 255, 255, 0.1)) — Tactical overlays and floating elements
- **Focus Gold** (#EAB308) — Status indicators and micro-details

## 3. Typography Rules
- **Display:** Libre Caslon Text — Track-tight, controlled scale. Used for emotive headlines.
- **Heading:** Bricolage Grotesque — For tactical, high-impact titles.
- **Body:** Bodoni Moda — Relaxed leading, editorial feel.
- **Mono:** JetBrains Mono — For data points, timestamps, and tech specs.
- **Banned:** Inter, generic system fonts.

## 4. Component Stylings
* **Bento Cards:** Varying aspect ratios (1:1, 2:1, 1:2). Generously rounded corners (3rem). Subtle 1px borders in Espresso/10.
* **Buttons:** "Capsule-in-Capsule" design. Primary: Espresso with Sienna inner dot. Active: -1px Y-translate.
* **Images:** "Double-Bezel" framing. 8px gap between image and its container. Selective motion-blur on scroll.
* **Typography Images:** Small, rounded photos (aspect 1:1) placed inline within headlines to act as visual punctuation.

## 5. Layout Principles
- **Hero:** Asymmetric Bento Grid (3-column, mixed heights). Headlines break grid boundaries.
- **Feature Journey:** Horizontal Scroll Track for "The Ritual" sequence. Each step occupies full viewport width but transitions laterally.
- **Grid:** Strict 12-column grid with 32px gutters. No centered layouts allowed.
- **Density:** High variance. Tight information clusters surrounded by expansive whitespace.

## 6. Motion & Interaction
- **Scroll Parallax:** Elements move at varying speeds. Headlines move slower than background images.
- **Spring Physics:** `{ stiffness: 80, damping: 20 }` for a premium, heavy feel.
- **Staggered Orchestration:** Sequential reveal of bento items from top-left to bottom-right.
- **Hard-Accelerated:** Transforms and Opacity only. No height/width animations.

## 7. Anti-Patterns (Banned)
- No emojis.
- No centered hero sections.
- No generic 3-column feature rows.
- No simple vertical stacks for features.
- No "Scroll to explore" filler text.
- No pure black (#000000).
- No instant hover states (min 200ms transition).
- No overlapping text on images unless background is dimmed 60%+.
