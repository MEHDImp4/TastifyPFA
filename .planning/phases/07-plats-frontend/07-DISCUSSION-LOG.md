# Phase 7: Plats Frontend - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 07-plats-frontend
**Areas discussed:** List layout, Category handling, Status controls, Create/edit form scope

---

## List Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Data table | Reuse the categories management table pattern | |
| Visual cards/grid | Use a more image-driven management surface | |
| Hybrid | Table on desktop, cards on mobile | ✓ |
| You decide | Delegate the layout choice | |

**User's choice:** Hybrid

| Sub-option | Selected |
|------------|----------|
| Desktop shows image, name, category, price, availability, active state, actions | ✓ |
| Mobile cards use a manager snapshot with quick management controls | ✓ |
| Automatic breakpoint switch, no manual toggle | ✓ |

**Notes:** Phase 7 should preserve dense manager workflows on desktop while still keeping mobile as a real management surface.

---

## Category Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Single master list + category filter | One page with category filter controls | ✓ |
| Category-first sections | Group dishes by category on the page | |
| Category navigation first | Pick a category before managing dishes | |
| You decide | Delegate the organization choice | |

**User's choice:** Single master list + category filter

| Sub-option | Selected |
|------------|----------|
| Default filter = All categories | ✓ |
| Category filter is a primary top-bar control | ✓ |
| Filtered empty state stays scoped and preserves category context in create flow | ✓ |
| New dish preselects the current category filter but remains editable | ✓ |

**Notes:** Category context should reduce repetitive work without trapping the manager in a single category.

---

## Status Controls

| Option | Description | Selected |
|--------|-------------|----------|
| Both inline | `Disponible` and `Actif` both editable from list/cards | ✓ |
| Availability inline, active in drawer | Split operational and structural status editing | |
| Both in drawer | Keep the list visually lighter | |
| You decide | Delegate the status UX choice | |

**User's choice:** Both inline

| Sub-option | Selected |
|------------|----------|
| Instant update on toggle | ✓ |
| Separate labeled controls for `Disponible` and `Actif` | ✓ |
| Inactive dishes stay visible, dimmed, and editable | ✓ |
| Mobile cards keep status controls in a compact action row | ✓ |

**Notes:** The manager should be able to react quickly to menu changes without opening the drawer for routine status updates.

---

## Create/Edit Form Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Practical manager form | Structured drawer with all required fields and inline validation | ✓ |
| Minimal form | Show only the most essential fields | |
| Rich editorial form | More presentation-heavy, more polished form structure | |
| You decide | Delegate the form richness choice | |

**User's choice:** Practical manager form

| Sub-option | Selected |
|------------|----------|
| Three groups: basic info, pricing/operations, media/status | ✓ |
| Standard field grouping | ✓ |
| Strict inline validation for price and prep time | ✓ |
| Basic file input with preview, matching categories | ✓ |
| Edit drawer fully prefilled | ✓ |

**Notes:** The drawer should stay consistent with the categories workflow while covering the broader dish field set.

---

## Claude's Discretion

- Exact breakpoint thresholds for switching between table and card layouts
- Exact implementation style for immediate inline status updates
- Empty, loading, and error state microcopy and visual treatment
- Filter control implementation details as long as it stays lightweight and prominent

## Deferred Ideas

- Search/filter expansion beyond category
- Bulk actions for dishes
- Drag-to-reorder or richer menu curation tools
- Recipe or stock linkage inside the dish form
- Enhanced media upload UX
