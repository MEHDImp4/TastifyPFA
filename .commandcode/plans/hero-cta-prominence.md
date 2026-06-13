# Hero CTA Button Prominence — Implementation Plan

**Goal:** Make the landing page hero CTA buttons visually prominent on mobile without breaking the sober restaurant aesthetic.

---

## Problem

The hero's "Voir la Carte" / "Réserver une table" buttons at `PortalHomePage.tsx:61-64` lack visual weight on mobile:
- 56px tall (`min-h-14`) — same as everywhere else, no hero distinction
- No icons — text-only feels thin
- 11px uppercase text with `tracking-wider` — restrained to the point of being easy to miss

## Files to Change

| File | What Changes |
|---|---|
| `app/frontend/client-app/src/pages/Home/PortalHomePage.tsx` | Add icons, increase mobile height, widen tracking |

## Changes (PortalHomePage.tsx)

### 1. Add icon imports (lines 5-8)

Add `CalendarDays` and `UtensilsCrossed` to the lucide-react import.

### 2. Replace the CTA button container (lines 61-64)

Increase mobile height to 64px, add descriptive icons, widen letter-spacing, add `group` for hover micro-interaction on the primary button's trailing arrow.

**Before:**
```tsx
<div className="flex flex-col sm:flex-row gap-4 pt-2 sm:pt-4">
    <Link to="/menu" className="btn-primary min-h-14">
    Voir la Carte
    </Link>
    <Link to="/reservations" className="btn-secondary min-h-14">
    Réserver une table
    </Link>
</div>
```

**After:**
```tsx
<div className="flex flex-col sm:flex-row gap-4 pt-2 sm:pt-4">
    <Link
      to="/menu"
      className="btn-primary w-full min-h-16 sm:min-h-14 gap-3 text-[11px] tracking-[0.18em] px-6 group"
    >
      <UtensilsCrossed className="w-5 h-5 sm:w-4 sm:h-4" />
      Voir la Carte
      <ArrowRight className="w-4 h-4 ml-auto sm:ml-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
    <Link
      to="/reservations"
      className="btn-secondary w-full min-h-16 sm:min-h-14 gap-3 text-[11px] tracking-[0.18em] px-6 group"
    >
      <CalendarDays className="w-5 h-5 sm:w-4 sm:h-4" />
      Réserver une table
    </Link>
</div>
```

### What each change does

| Change | Why |
|---|---|
| `w-full` | Full-width explicitly (flex-col handles it but being explicit avoids surprises) |
| `min-h-16 sm:min-h-14` | 64px on mobile (matches auth page), 56px on desktop — more tap presence |
| `tracking-[0.18em]` | Wider letter-spacing than `tracking-wider` (0.05em) — more visual presence |
| `gap-3` | Room for icon + text |
| `group` | Enables `group-hover` on trailing arrow |
| `UtensilsCrossed` | Fork+knife icon — instant "menu" recognition |
| `CalendarDays` | Calendar icon — instant "booking" recognition |
| `w-5 h-5 sm:w-4 sm:h-4` | Larger icons on mobile for visual weight |
| Trailing `ArrowRight` | Action affordance with micro-animation on hover |

## Design Rationale

- Follows existing auth page patterns (Login/Register use `min-h-16`, `tracking-[0.28em]`, `group`)
- No global `.btn-primary` change — only the hero instance
- Sober palette maintained — no new colors or gradients
- `group-hover:translate-x-0.5` matches existing patterns in ForgotPassword/ResetPassword
