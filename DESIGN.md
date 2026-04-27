# TastifyPFA Design System: The ECO-FRESH Manifesto

This document defines the visual and interactive identity of TastifyPFA. We don't just build functional software; we build interfaces that feel right through trained taste and obsessive attention to unseen details.

## 1. Vision: "Organic Efficiency"
TastifyPFA combines the warmth of Moroccan hospitality with the precision of a high-end tool. The interface must be fast, tactile, and professional.

## 2. Color Palette (ECO-FRESH)
Derived from the official specification, these tokens form the foundation of our identity.

| Token | Hex | Role | Usage |
| --- | --- | --- | --- |
| **Dark (Ardoise)** | `#264653` | Background / Depth | Deep surfaces, sidebars, and primary dark mode background. |
| **Teal (Emerald)** | `#2A9D8F` | Primary / Success | Primary buttons, success states, and brand highlights. |
| **Amber (Sand)** | `#E9C46A` | Warning / Accent | Secondary actions, warnings, and highlighting selected states. |
| **Orange (Clay)** | `#F4A261` | Secondary / Call to Action | Promotional elements, specific UI accents. |
| **Terracotta (Red)** | `#E76F51` | Error / Destructive | Delete buttons, errors, and critical alerts. |

### Semantic Layers (Dark Mode Focus)
- **Background**: `#1a323b` (A deeper shade of Ardoise for maximum contrast).
- **Surface**: `#264653` (The standard Ardoise for cards/containers).
- **Surface Elevated**: `#325a6a` (Subtle 1px border or slightly lighter background for depth).

## 3. Typography
We use **Inter** for its clarity and neutral tone, allowing the brand colors to shine.
- **Headlines**: Semi-bold (600), tight tracking (-0.02em).
- **Body**: Regular (400), generous line-height (1.6) for readability.
- **Labels/Numbers**: Medium (500), tabular figures for prices/quantities.

## 4. Animation Decision Framework
Animations are not decorations; they are feedback. We follow Emil Kowalski’s principles for "Correctness."

### The "Invisible" Rules
| Aspect | Decision | Rationale |
| --- | --- | --- |
| **Press Feedback** | `scale(0.97)` on `:active` | Instant confirmation that the UI "heard" the user. |
| **Entry Transitions** | `scale(0.95)` → `scale(1)` | Nothing in the real world appears from `scale(0)`. |
| **Duration** | 150ms - 250ms | SNAPPY. Anything slower feels like lag. |
| **Easing** | `cubic-bezier(0.23, 1, 0.32, 1)` | A strong ease-out for responsive feedback. |
| **Property Control** | NEVER use `transition: all` | Specify exact properties (transform, opacity) for GPU performance. |

### Frequency-Based Motion
- **100+ times/day (Scanning QR, Kitchen actions)**: NO animation. Zero latency.
- **Occasional (Modals, Toasts)**: Standard ease-out (200ms).
- **Rare (Success celebration)**: Spring-based, playful motion.

## 5. Component Engineering Standards

### Buttons
- **Shape**: `rounded-lg` (8px). Organic but professional.
- **Motion**: 
  - Hover: Subtle brightness increase (10%).
  - Active: `scale(0.97)` + 160ms ease-out.
- **Validation**: Must pass WCAG AA contrast against Ardoise background.

### Cards & Modals
- **Surface**: Ardoise (`#264653`) with a `1px` border of `white/10`.
- **Depth**: Use background lightness shifts instead of heavy shadows.
- **Modals**: Must animate from the center with a subtle `scale(0.95)` and `blur(2px)` entry.

### Popovers (Dropdowns, Tooltips)
- **Origin-Aware**: Must scale from their trigger point, not the center.
- **Logic**: Tooltips should skip delay on subsequent hovers if one is already open.

## 6. Design Audit (Design Engineering Review)

Apply this checklist to every UI PR:

| Before | After | Why |
| --- | --- | --- |
| `transition: all 300ms` | `transition: transform 180ms ease-out` | Avoid `all` for perf; 300ms is too slow for UI. |
| Modal pops in instantly | `scale(0.95) + opacity: 0` entry | Prevents jarring visual shifts. |
| Button has no press state | `transform: scale(0.97)` on `:active` | Essential physical feedback. |
| Popover scales from center | `transform-origin: [trigger]` | Establishes spatial consistency. |
| Sharp corners (`0px`) | `rounded-xl` (12px) | Matches the "Organic Efficiency" vision. |

## 7. Responsive & Fluid Strategy
The interface must feel native on every device, from KDS tablets to client smartphones.

### Rules of Responsiveness
- **Mobile-First**: Styles are written for mobile by default and enhanced for desktop via `@media (min-width: ...)`.
- **Fluid Layouts**: Use relative units (`%`, `vh`, `vw`) and Flexbox/Grid. Avoid fixed pixel widths on containers.
- **Stack Shifting**: Multi-column layouts must gracefully collapse into single columns without loss of functionality.
- **Adaptive Typography**: Use `clamp()` for headlines to ensure they remain legible and proportional across all screen sizes.

## 8. Performance & Accessibility
- **GPU Only**: Only animate `transform` and `opacity`.
- **Reduced Motion**: Respect `prefers-reduced-motion` by swapping transforms for simple opacities.
- **Touch Targets**: Minimum `44px` height/width for ALL interactive elements.
- **No Hover Dependency**: Critical actions must never be hidden behind a hover state, as touch devices do not support hover.
- **Pointer Media Queries**: Gate hover effects behind `@media (hover: hover) and (pointer: fine)` to prevent "sticky" hover states on mobile.
