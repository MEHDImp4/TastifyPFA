# TastifyPFA Design System

This document establishes the comprehensive design system for TastifyPFA, focusing on a premium, modern UI.

## Vision
**"Efficiency without fatigue."**
The design must provide a premium feel with maximum usability. We support both Dark (default) and Light modes, with Dark mode serving as the primary focus for our aesthetics.

## Color Palette

Define these core CSS tokens in our global stylesheets. Ensure high contrast across both modes.

### Dark Mode (Default)
- **Primary**: `hsl(210, 100%, 50%)` - (A sharp, vibrant blue)
- **Secondary**: `hsl(215, 15%, 20%)` - (Subtle gray-blue for accents)
- **Accent**: `hsl(280, 100%, 65%)` - (Vibrant purple for highlights)
- **Background**: `hsl(220, 10%, 10%)` - (Deep near-black)
- **Surface**: `hsl(220, 10%, 14%)` - (Slightly lighter than background)
- **Foreground**: `hsl(0, 0%, 95%)` - (Off-white for readability)
- **Error**: `hsl(0, 100%, 65%)` - (Clear red)
- **Success**: `hsl(145, 65%, 45%)` - (Clean green)

### Light Mode
- **Primary**: `hsl(210, 100%, 45%)`
- **Secondary**: `hsl(215, 15%, 90%)`
- **Accent**: `hsl(280, 100%, 60%)`
- **Background**: `hsl(0, 0%, 98%)`
- **Surface**: `hsl(0, 0%, 100%)`
- **Foreground**: `hsl(220, 10%, 15%)`
- **Error**: `hsl(0, 100%, 50%)`
- **Success**: `hsl(145, 65%, 35%)`

## Typography

Use system fonts mapped over the Inter family.
- **Font Stack**: `font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **Weights**: 
  - Regular: `400`
  - Medium: `500`
  - Semibold: `600`
  - Bold: `700`
- **Sizes**: Follow standard Tailwind classes (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, etc.).

## Elevation & Depth

Use tonal layers instead of classic drop shadows for Dark Mode.
- **Surface Level 1**: `bg-surface` border `border-white/5`
- **Surface Level 2**: `bg-surface-elevated` border `border-white/10`
- Avoid heavy `box-shadow` in dark mode; rely on subtle borders and background lightness shifts.

## Shapes & Radius

Use an organic design language.
- **Avoid**: `rounded-none`, strict sharp edges unless required by system components.
- **Standard Radius**: `rounded-xl` and `rounded-2xl` for containers, modals, and larger cards.
- **Small Radius**: `rounded-lg` for buttons and inputs.

## Animations (Emil Kowalski Principles)

Animations must feel snappy, physical, and purposeful.
- **No `transition-all`**: Always specify exactly what properties are animating (e.g., `transition-opacity`, `transition-transform`).
- **Duration**: UI duration must be `< 200ms`.
- **Easing**: Use `ease-out` for entries.
- **Press States**: Use `active:scale-[0.97]` for interactive elements (buttons, cards).
- **Scaling**: Never scale from 0. Scale from 0.95 minimum.

## Components Standards

- **Buttons**: `rounded-lg`, distinct hover state (slight brightness increase), `active:scale-[0.97]`, explicit transition properties.
- **Cards**: `rounded-2xl`, `bg-surface`, `border border-white/5` (in dark mode), subtle inner padding.
- **Inputs**: `rounded-lg`, clearly defined focus ring (`ring-2 ring-primary/50`), subtle background.
- **Modals**: `rounded-2xl`, entry animation `ease-out duration-150` scale from `0.95`.
- **Sidebar**: Defined as a tonal layer distinct from the main background, cleanly separated by a 1px border.
- **Navbar**: Glassmorphic or solid surface background, sticky, high contrast text.

## Anti-patterns (Never Do This)

- ❌ Using `text-white` directly on a `bg-primary` button without considering contrast ratios or design tokens.
- ❌ Using `transition-all` anywhere in the codebase.
- ❌ Mixing Light and Dark mode palettes arbitrarily.
- ❌ Using heavy, dark drop-shadows on deep black backgrounds.
- ❌ Scaling elements from `scale-0` on entry.
- ❌ Hard corners (`rounded-none`) on main UI components.
