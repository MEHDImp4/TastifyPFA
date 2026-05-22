---
name: Tastify
colors:
  surface: '#151312'
  surface-dim: '#151312'
  surface-bright: '#3c3937'
  surface-container-lowest: '#100e0c'
  surface-container-low: '#1d1b1a'
  surface-container: '#221f1e'
  surface-container-high: '#2c2928'
  surface-container-highest: '#373432'
  on-surface: '#e8e1de'
  on-surface-variant: '#d8c2b6'
  inverse-surface: '#e8e1de'
  inverse-on-surface: '#33302e'
  outline: '#a08d81'
  outline-variant: '#53443a'
  surface-tint: '#ffb785'
  primary: '#ffb785'
  on-primary: '#502400'
  primary-container: '#8d4e1c'
  on-primary-container: '#ffceaf'
  inverse-primary: '#8d4e1c'
  secondary: '#ffb785'
  on-secondary: '#502400'
  secondary-container: '#753901'
  on-secondary-container: '#faa467'
  tertiary: '#f2bb96'
  on-tertiary: '#49280e'
  tertiary-container: '#7e5537'
  on-tertiary-container: '#ffcfae'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc6'
  primary-fixed-dim: '#ffb785'
  on-primary-fixed: '#301400'
  on-primary-fixed-variant: '#703705'
  secondary-fixed: '#ffdcc6'
  secondary-fixed-dim: '#ffb785'
  on-secondary-fixed: '#301400'
  on-secondary-fixed-variant: '#723700'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#f2bb96'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#633e22'
  background: '#151312'
  on-background: '#e8e1de'
  surface-variant: '#373432'
typography:
  display-lg:
    fontFamily: Public Sans
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Public Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inclusive Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inclusive Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  ui-label-bold:
    fontFamily: Rethink Sans
    fontSize: 14px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: 0.25em
  ui-data-dense:
    fontFamily: Rethink Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.0'
  ui-button:
    fontFamily: Rethink Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  staff-gutter: 1rem
  staff-margin: 1.5rem
  client-gutter: 3rem
  client-margin: 5vw
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 24px
---

## Brand & Style
The design system for this platform balances two distinct emotional worlds: the **Tactical Command Center** (Staff OS) and **Organic Sophistication** (Client Portal). The brand evokes the prestige of Michelin-star dining combined with the surgical precision of high-end operations, now reimagined in an "After-Hours" aesthetic.

The visual style is a fusion of **Modern Minimalism** and **High-Contrast Editorial**. It prioritizes "Absolute Visibility"—a philosophy where functional information is never obscured or secondary. The aesthetic avoids digital trends like blurs in favor of architectural structure. The interface should feel like a bespoke digital ledger viewed under dim, focused gallery lighting.

## Colors
The palette is grounded in the organic, warm tones of fine dining materials, shifted to a dark mode environment to simulate the atmosphere of an evening service.

- **Ink & Charcoal:** The primary canvas. These deep, dark neutrals provide a sophisticated foundation that reduces eye strain in low-light environments (kitchens and dining rooms).
- **Aged Paper (#fff8f5):** Now used primarily for high-contrast text and structural borders. This ensures "Absolute Visibility" against the dark background.
- **Sienna (#8d4e1c) & Amber (#8f4d17):** These earthy, glowing tones are used for interactive elements, primary call-to-actions, and branding accents, cutting through the dark canvas with clarity.

Maintain a high contrast ratio (minimum 7:1) for all functional text to ensure accessibility in both dimly lit dining rooms and bright kitchen environments.

## Typography
Typography is the cornerstone of this design system’s hierarchy. It uses a modern, high-legibility tri-font strategy:

1.  **Editorial Authority:** `Public Sans` is used for headlines and titles. It conveys modern strength and professional luxury.
2.  **Readable Luxury:** `Inclusive Sans` serves body copy, providing a clean, highly accessible experience for menus and long-form descriptions.
3.  **Technical Precision:** `Rethink Sans` is reserved for the UI "machinery"—buttons, data points, and labels. 

**Absolute Visibility Rule:** UI headers using Rethink Sans must be set in **Extra Bold** weights with a **0.25em letter-spacing** to ensure technical clarity and a distinct "command" feel.

## Layout & Spacing
This design system employs two distinct layout philosophies based on the user's context:

### 1. Staff OS (Tactical Command)
Uses a **12-column fixed grid**. It is designed for high information density. 
- **Gutters:** 16px (1rem).
- **Margins:** 24px (1.5rem).
- **Behavior:** Content stays compact to minimize eye travel. Vertical rhythm is tight, utilizing `unit-sm` and `unit-md` for component grouping.

### 2. Client Portal (Organic Sophistication)
Uses a **Fluid grid** with expansive whitespace.
- **Gutters:** 48px (3rem).
- **Margins:** 5vw (dynamic).
- **Behavior:** Content is "breathable" and centered. It uses generous vertical padding (`unit-lg` and above) to create a serene, editorial browsing experience.

All spacing must be increments of 4px to maintain a strict mathematical rhythm.

## Elevation & Depth
In adherence to the "Absolute Visibility" and "No Blurs" requirements, depth is created through **Tonal Layering** and **Hard Outlines** rather than shadows. In this dark mode environment, depth is perceived as "illuminated" surfaces rather than cast shadows.

- **Surface Tiers:** Use subtle shifts in dark tones to indicate elevation. A "raised" card uses a slightly lighter charcoal background or a 1px solid `Aged Paper` (#fff8f5) border.
- **The "Parchment" Stroke:** Instead of ambient shadows, use 1px or 2px solid strokes to define containers. Against a dark background, these act as "rim lighting," reinforcing the tactical feel.
- **Zero Transparency:** Do not use backdrop blurs or semi-transparent layers. Content must be 100% opaque to ensure legibility and a sense of "physical" permanence.

## Shapes
The shape language is structured to differentiate between the "vessel" (containers) and the "tools" (components).

- **Containers (Cards, Modals, Sections):** Use a 16px (`rounded-lg`) corner radius. This creates a soft, organic frame for the content.
- **Components (Buttons, Inputs, Chips):** Use an 8px (`rounded-md`) corner radius. This sharper radius feels more precise and mechanical.
- **Interactive States:** On hover or active states, shapes should not change radius, but may increase border weight from 1px to 2px for explicit feedback.

## Components

### Buttons & Inputs
- **Staff OS:** High-density buttons with Rethink Sans (Bold). 8px radius. 1px light border against dark backgrounds.
- **Client Portal:** Larger hit areas, often using Primary Sienna as a solid fill with dark Ink text for maximum punch.
- **Inputs:** Use solid 1px light borders. Active states are indicated by a 2px Amber border. No glow effects.

### Icons (Lucide)
- **Staff OS:** 1.5px stroke width. Small, precise, and purely functional.
- **Client Portal:** 2.5px stroke width. Larger, more "illustrative" and organic in feel.

### Lists & Data
- **Staff Lists:** Zebra-striping using subtle tonal shifts of the dark background. High density (compact padding).
- **Client Cards:** Massive whitespace, Inclusive Sans for descriptions, 16px radius.

### Interactions
- **Spring Transitions:** All state changes (hover, toggle, modal entry) must use a subtle spring: `stiffness: 300, damping: 30`. 
- **State Feedback:** Since blurs and soft shadows are forbidden, use **Explicit Notifications**. Toast messages and inline alerts use the Amber accent color with heavy Rethink Sans type for "Absolute Visibility."