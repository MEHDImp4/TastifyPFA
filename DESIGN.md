---
name: Tastify
colors:
  surface: '#fff8f5'
  surface-dim: '#ffd1b3'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ea'
  surface-container: '#ffeade'
  surface-container-high: '#ffe3d2'
  surface-container-highest: '#ffdcc5'
  on-surface: '#301400'
  on-surface-variant: '#53443a'
  inverse-surface: '#4b2709'
  inverse-on-surface: '#ffede4'
  outline: '#867369'
  outline-variant: '#d8c2b6'
  surface-tint: '#8d4e1c'
  primary: '#8d4e1c'
  on-primary: '#ffffff'
  primary-container: '#d1854e'
  on-primary-container: '#4e2400'
  inverse-primary: '#ffb785'
  secondary: '#8f4d17'
  on-secondary: '#ffffff'
  secondary-container: '#fea86a'
  on-secondary-container: '#773b03'
  tertiary: '#775841'
  on-tertiary: '#ffffff'
  tertiary-container: '#b49076'
  on-tertiary-container: '#422a16'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc6'
  primary-fixed-dim: '#ffb785'
  on-primary-fixed: '#301400'
  on-primary-fixed-variant: '#703704'
  secondary-fixed: '#ffdcc6'
  secondary-fixed-dim: '#ffb785'
  on-secondary-fixed: '#301400'
  on-secondary-fixed-variant: '#713700'
  tertiary-fixed: '#ffdcc4'
  tertiary-fixed-dim: '#e7bfa2'
  on-tertiary-fixed: '#2b1605'
  on-tertiary-fixed-variant: '#5d412b'
  background: '#fff8f5'
  on-background: '#301400'
  surface-variant: '#ffdcc5'
typography:
  display-accent:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Bodoni Moda
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Bodoni Moda
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.03em
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

This design system embodies **Organic Sophistication** tailored for high-end hospitality environments. The brand personality is warm, heritage-inspired, and deeply editorial, acting as a curated digital concierge that manages complex restaurant operations with grace.

The aesthetic fuses **Classical Typography** with modern tonal harmony. It relies on a rich, sun-drenched color palette, high-contrast serif typefaces, and a "Tonal Spot" architecture to create a sense of grounded luxury. The emotional response should be one of artisanal quality, timeless reliability, and thoughtful attention to detail.

The style leverages **Layered Tonality** for depth, using subtle shifts in warm ambers and soft terracotta tones to define hierarchy, ensuring the UI feels inviting and expensive even when displaying dense operational data.

## Colors

The palette is strictly curated to maintain a warm, high-end hospitality aesthetic, moving toward a more vibrant, sun-baked warmth.

- **Primary:** Burnt Sienna (#d1854e) is used for primary brand moments and essential interactive states, providing a glowing, clay-inspired focal point.
- **Surface:** The canvas utilizes a range of warm earth neutrals. Surfaces move away from cold whites toward a layered approach of soft tans and parchment-inspired tones.
- **Accents:** Secondary and tertiary tones provide categorization and subtle status differentiation without the harshness of traditional UI colors.
- **Typography Colors:** Primary text uses deep roasted neutrals to keep a rich ink-on-paper contrast.

## Typography

The typographic system utilizes a sophisticated trio of fonts to balance classical heritage with modern utility.

- **Libre Caslon Text:** Used for headlines and display moments.
- **Bodoni Moda:** The primary body typeface for editorial long-form content.
- **Bricolage Grotesque:** Used for labels, data points, and technical UI elements.

**Scaling:** For mobile devices, `display-accent` should scale down to 32px, and `headline-lg` to 24px.

## Layout & Spacing

This design system employs a **Fixed Grid** philosophy for desktop to maintain an architectural feel, switching to a fluid model for mobile tablets.

- **Grid:** A 12-column grid with generous 24px gutters.
- **Rhythm:** An 8px linear scale with a 4px sub-unit for fine-tuning.
- **Padding:** Content containers should use at least 32px internal padding to preserve breathing room.

## Elevation & Depth

Hierarchy is established through a sophisticated layering system:

1. **Base Layer:** Warm parchment and terracotta neutrals.
2. **Structural Layer:** Use subtle tonal shifts rather than harsh borders.
3. **Tonal Spotting:** Important elements are elevated using soft fills in primary and secondary hues.
4. **Shadows:** Rare, soft, and warm when needed.

## Shapes

The shape language is rounded to provide a soft, organic feel that counters the crispness of the serif typography.

- **Primary Containers:** 1rem (16px) corner radius.
- **Secondary Elements:** 0.5rem (8px) corner radius.
- **Status Badges:** Softly rounded rectangles rather than digital pills.

## Components

- **Buttons:** Primary buttons use Burnt Sienna with high-contrast text.
- **Inputs:** Fields are defined by subtle tonal backgrounds and a 1px bottom border, transforming into primary sienna on focus.
- **Tonal Cards:** Warm neutral backgrounds with soft corners and low-contrast borders.
- **Selection Controls:** Use primary sienna for active states.
- **Status Badges:** Use secondary and tertiary palettes with deep-toned text.
- **The "Floor Plan" Grid:** Uses the same warm tonal aesthetic to map tables and zones with architectural clarity.
