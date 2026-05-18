# Phase 41: Premium Portal Refinement PLAN

## 1. Executive Summary
This plan focuses on elevating the `PortalHomePage.tsx` to "Awwwards-tier" premium status. It implements the "Premium Editorial" asymmetric design rules, introduces the "Double-Bezel" pattern project-wide where appropriate, and ensures high-end typography and iconography consistency.

## 2. Tasks

### Task 1: Refine "The Vision" Section (auto)
- **Goal:** Update the Vision section to follow a 12-column asymmetric grid and apply premium framing.
- **Actions:**
  - Update container max-width to `max-w-[1600px]`.
  - Update grid to `lg:grid-cols-12`.
  - Set content block to `lg:col-span-6`.
  - Set image block to `lg:col-span-6`.
  - Implement "Double-Bezel" architecture for the image (mirroring the Hero section).
  - Ensure correct font usage (`font-display-accent` for headers, `font-body-text` for copy).
- **Verification:** Inspect JSX structure and classes.

### Task 2: Refine "Atmosphere Gallery" Section (auto)
- **Goal:** Break symmetry and add visual interest.
- **Actions:**
  - Change grid layout from symmetric 8/4 to an asymmetric 7/5 or similar.
  - Add a third element (stylized text block or small detail image) to create a more dynamic composition.
  - Apply `double-bezel` or high-end framing to all gallery items.
- **Verification:** Inspect JSX structure.

### Task 3: Refine "High-End CTA" Section (auto)
- **Goal:** Make the final call-to-action feel "massive and clean".
- **Actions:**
  - Implement "Button-in-Button" pattern for "Initialize Profile".
  - Scale up typography for the main CTA header.
  - Refine spacing and background animations.
- **Verification:** Inspect JSX structure.

### Task 4: General Component Polish (auto)
- **Goal:** Consistent premium feel across all elements.
- **Actions:**
  - Audit and update all Lucide icons to use `strokeWidth={1.5}` or `{1}`.
  - Verify section alignments and padding (standardize on `max-w-[1600px]` and `px-6 md:px-12`).
  - Add `font-body-text` to all descriptive paragraphs.
- **Verification:** Inspect file for icon props and class names.

## 3. Success Criteria
- [ ] Vision section uses 12-column grid and Double-Bezel.
- [ ] Atmosphere Gallery is asymmetric and has at least 3 elements.
- [ ] CTA uses Button-in-Button pattern.
- [ ] All icons have standardized `strokeWidth`.
- [ ] Production build (`npm run build`) passes in `client-app`.
