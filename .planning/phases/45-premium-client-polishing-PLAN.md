# Phase: Premium Client Polishing - PLAN

## Goal
Apply a "high-end finish" to core pages in `client-app` using Framer Motion, consistent spacing, and the 'Warm Organic Sophistication' palette.

## Core Mandates
- **Framer Motion**: Staggered children for entry animations.
- **Spacing**: Use `client-margin` (5vw) and `client-gutter` (3rem).
- **Palette**: Background `#FAF9F6`, Primary `#D14D1A`.
- **Typography**: `font-serif italic` for headings.
- **Interactions**: `active:scale-95`, smooth hover transitions.
- **Language**: French.

## Task Breakdown

### 1. MenuPage.tsx Refinement
- **Category Switcher**: Add `layoutId` for the active indicator to have a smooth sliding effect.
- **Grid Layout**: Implement staggered entry for menu cards.
- **Card Design**: Enhance hover states with subtle scale and shadow shifts. Ensure descriptions use `italic` and secondary typography.
- **Micro-interactions**: Refine the "Add to cart" button with success feedback animation.

### 2. CheckoutPage.tsx Refinement
- **Item Removal**: Use `AnimatePresence` and `layout` for smooth removal (already partially there, but ensure it's fluid).
- **Order Summary**: Refine the layout of the summary card. Add a "premium" touch with subtle gradients or borders.
- **Success State**: Enhance the success page with a celebratory animation.

### 3. AccountPage.tsx Refinement
- **Layout**: Polish the bento grid layout. Ensure consistent spacing and borders.
- **Animations**: Add staggered entry for profile sections and lists.
- **Profile Card**: Enhance the profile header with better typography and interactive elements.

### 4. LoyaltyPage.tsx Refinement
- **Progress Bar**: Make the points progress animation more fluid and premium.
- **Reward Cards**: Add staggered entry and better hover states.
- **Micro-animations**: Add subtle sparkles or motion to "exclusive" perks.

### 5. PortalHomePage.tsx Check
- Verify if any sections can benefit from better micro-animations or improved responsive spacing.

## Verification Strategy
- **Visual Check**: Ensure all pages look "premium" and follow the palette.
- **Build Test**: Run `npm run build` in `client-app` to ensure no regressions.
- **Linter**: Run `npm run lint` if available.
