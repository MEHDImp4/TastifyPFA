# Secondary Button Border Visibility — Plan

## Root Cause

`border-outline-variant` (`#D4D4D8`) has **1.3:1 contrast** against white — functionally invisible. Since `btn-secondary` is an outline button whose only visual differentiator from plain text or from `btn-primary` is this border, secondary actions appear to float without boundaries on the app's near-white backgrounds.

I can't darken the token globally — it's used across 26+ locations for subtle container/dividing borders where low contrast is appropriate.

## Change — `btn-secondary` border only

Replace `border-outline-variant` with `#B0B0B4` directly in both apps' `btn-secondary` definitions. This hits ~2.3:1 contrast — clearly visible as a button boundary while staying lighter than the hover state (`#111111`).

| Before | After |
|---|---|
| `border border-outline-variant` (#D4D4D8, 1.3:1) | `border border-[#B0B0B4]` (~2.3:1) |
| Hover: `border-on-background` (#111111) | Unchanged |

## Also — Remove duplicate `btn-ghost` in backoffice

`btn-ghost` and `btn-secondary` in `backoffice-app/src/index.css` are **character-for-character identical**. Change `btn-ghost` to have no border at all (true ghost button):

```css
.btn-ghost {
  @apply min-h-[44px] px-6 bg-transparent rounded-md inline-flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-background hover:bg-surface-container-high active:scale-[0.98] disabled:opacity-45 disabled:active:scale-100 transition-all duration-200 text-center leading-tight;
}
```

This gives backoffice a genuine alternative: filled primary, outlined secondary, borderless ghost.

## Files changed

| File | Edit |
|---|---|
| `client-app/src/index.css:163` | `border-outline-variant` → `border-[#B0B0B4]` in `.btn-secondary` |
| `backoffice-app/src/index.css:98` | `border-outline-variant` → `border-[#B0B0B4]` in `.btn-ghost` |
| `backoffice-app/src/index.css:102` | `border-outline-variant` → `border-[#B0B0B4]` in `.btn-secondary` |
| `backoffice-app/src/index.css:98-99` | Rewrite `.btn-ghost` to be borderless (true ghost) |
