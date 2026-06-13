# Mobile Navigation Visual Hierarchy — Plan

## Problems

1. **No active state in mobile nav** — desktop nav tracks `location.pathname === link.to` (highlighted text), mobile nav doesn't. All links look identical.
2. **Redundant "Log in" link in mobile header** (line 100-106) — shows a compact "Log in" on mobile while the nav overlay already has "Connexion Membre" at the bottom. Two different entry points, different labels.
3. **Mobile nav links lack layering** — all `text-3xl sm:text-4xl font-bold` with no secondary info. User can't tell which page they're on.

## Changes — `PublicLayout.tsx`

### 1. Remove the duplicate mobile header login link (lines 98-106)

Delete this block entirely — it duplicates the nav overlay's bottom CTA and uses inconsistent label ("Log in" vs "S'identifier" on desktop).

### 2. Add active state to mobile nav links (lines 148-158)

Add `location.pathname === link.to` check with active/inactive styling:

```tsx
{navLinks.map((link) => (
  <Link
    key={link.to}
    to={link.to}
    onFocus={() => preloadRoute(link.to)}
    onPointerEnter={() => preloadRoute(link.to)}
    onClick={() => setIsMenuOpen(false)}
    className={`text-3xl sm:text-4xl font-bold tracking-tight break-words transition-colors ${
      location.pathname === link.to
        ? 'text-on-background'
        : 'text-on-surface-variant hover:text-on-background'
    }`}
  >
    {link.label}
  </Link>
))}
```

### What this does

| Before | After |
|---|---|
| All links same `text-on-background` | Active page is full black, others are gray |
| No way to tell current page | Visual distinction — active stands out |
| Duplicate mobile "Log in" in header | Single clear path: mobile nav CTA only |
| "Log in" vs "S'identifier" inconsistency | Consistent French terminology |
