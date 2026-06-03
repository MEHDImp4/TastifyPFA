---
phase: 29
plan: 04
type: execute
gap_closure: true
status: completed
---

## Execution Summary

Fixed the Vite import-analysis failure in `menu.ts` by replacing the relative import path with the `@shared` alias.

## Details

- **Files Modified:**
  - `app/frontend/portail/src/api/menu.ts`
- **Action:** Replaced `../../../shared/auth/axiosInstance` with `@shared/auth/axiosInstance`.
- **Verification:** Ran `npm --prefix app/frontend/portail run build` which succeeded without import analysis errors.

## Artifacts Created / Modified

- `app/frontend/portail/src/api/menu.ts`
