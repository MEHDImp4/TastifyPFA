---
name: Intelligent Restaurant OS
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#434656'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#747688'
  outline-variant: '#c4c5d9'
  surface-tint: '#124af0'
  primary: '#0040e0'
  on-primary: '#ffffff'
  primary-container: '#2e5bff'
  on-primary-container: '#efefff'
  inverse-primary: '#b8c3ff'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dddddd'
  on-secondary-container: '#606161'
  tertiary: '#525559'
  on-tertiary: '#ffffff'
  tertiary-container: '#6a6d71'
  on-tertiary-container: '#eef0f5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001356'
  on-primary-fixed-variant: '#0035be'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e0e2e7'
  tertiary-fixed-dim: '#c4c6cb'
  on-tertiary-fixed: '#181c20'
  on-tertiary-fixed-variant: '#44474b'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-accent:
    fontFamily: Instrument Serif
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max: 1440px
---

## Brand & Style

This design system embodies **Minimalist Luxury** tailored for high-end hospitality environments. The brand personality is architectural, precise, and unobtrusive, acting as a sophisticated "invisible hand" that manages complex restaurant operations. 

The aesthetic fuses **Hyper-Clean Tech** with editorial elegance. It relies on extreme whitespace, razor-sharp hairlines, and a "Double-Bezel" component architecture to create a sense of structural depth. The emotional response should be one of calm, professional confidence and effortless control.

The style leverages **Glassmorphism** for depth, specifically for transient overlays and floating navigation, ensuring the UI feels light and breathable even when displaying dense operational data.

## Colors

The palette is strictly curated to maintain a high-end, clean-room aesthetic. 

- **Primary:** Cobalt Blue (#2E5BFF) is reserved exclusively for primary calls to action and critical interactive states. 
- **Surface:** The canvas is always Pure White (#FFFFFF). Surfaces are never "grayed out"; depth is instead communicated through ultra-thin 0.5px hairlines (#E5E5E5) and soft shadows.
- **Accents:** Status indicators utilize desaturated, high-luminance pastels (Pastel Green and Pastel Blue) to signify state without breaking the minimalist harmony.
- **Typography Colors:** Primary text uses a deep charcoal (#1A1A1A) rather than pure black to maintain a softer, more sophisticated contrast against the white background.

## Typography

The typographic system utilizes a high-contrast pairing to balance technical precision with hospitality warmth.

- **Plus Jakarta Sans:** This is the workhorse font. Use it for all functional UI elements, data grids, and body copy. Its geometric clarity ensures legibility in fast-paced restaurant environments.
- **Instrument Serif (Italic):** Reserved for high-end accent titles, "welcome" moments, and editorial highlights. It should always be set in italics with tight letter-spacing to evoke a sense of a premium menu or wine list.

**Scaling:** For mobile devices, `display-accent` should scale down to 32px, and `headline-lg` to 24px to maintain balance.

## Layout & Spacing

This design system employs a **Fixed Grid** philosophy for desktop to maintain an "architectural" feel, switching to a fluid model for mobile tablets.

- **Grid:** A 12-column grid with generous 24px gutters. Elements should align strictly to the grid to reinforce the "Intelligent OS" precision.
- **Rhythm:** An 8px linear scale is used for component spacing, with a 4px sub-unit for fine-tuning small elements like label-to-input relationships.
- **Padding:** High-end hospitality tech requires "breathing room." Content containers should utilize internal padding of at least 32px to avoid visual clutter.

## Elevation & Depth

Hierarchy is established through a sophisticated layering system:

1.  **Base Layer:** Pure White (#FFFFFF) canvas.
2.  **Structural Layer:** 0.5px Hairlines (#E5E5E5) define boundaries without adding visual weight.
3.  **The Double-Bezel:** All primary cards feature a 1px inner border of #F5F5F5 and a 0.5px outer border of #E5E5E5. This "bezel" creates a subtle 3D effect that feels machined and precise.
4.  **Floating Layer:** Glassmorphism is applied to modals, dropdowns, and navigation bars. Use a background blur of 20px and a 60% translucent white fill.
5.  **Shadows:** Shadows are rarely used for static elements. When used for "active" floating states, they must be ultra-diffused: `0px 20px 40px rgba(0, 0, 0, 0.04)`.

## Shapes

The shape language is consistently "Rounded-2XL" to soften the technical precision of the grid. 

- **Primary Containers:** 1.5rem (24px) corner radius.
- **Secondary Elements (Buttons/Inputs):** 0.75rem (12px) corner radius.
- **Status Badges:** Fully pill-shaped for immediate distinction from interactive buttons.
- **Double-Bezel Rule:** When nesting containers, the inner container's radius must be mathematically adjusted (Outer Radius - Padding) to maintain concentric harmony.

## Components

- **Buttons:** Primary buttons are Cobalt Blue with white text. Ghost buttons use a 0.5px hairline border. All buttons use 0.75rem rounding and should feel "weightless" (no heavy shadows).
- **Inputs:** Fields are defined by a 0.5px bottom-border only in default states, transforming into a full "Double-Bezel" container on focus.
- **Double-Bezel Cards:** The signature component of this design system. A white card with `rounded-2xl`, featuring a soft shadow and a layered 0.5px border.
- **Glass Overlays:** Modals and context menus must use `backdrop-filter: blur(20px)` and a white-tinted transparency to maintain the "Minimalist Luxury" feel.
- **Status Badges:** Use desaturated pastels with deep-toned text for readability. No borders on badges; they should appear as soft pools of color.
- **The "Floor Plan" Grid:** A specific component for restaurant layout that uses the same 0.5px hairline aesthetic to map out tables and zones with architectural clarity.