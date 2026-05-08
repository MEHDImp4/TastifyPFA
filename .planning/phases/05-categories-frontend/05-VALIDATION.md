# Phase 5: Categories Frontend - Validation Strategy

## 1. Automated Testing Strategy (TDD)
Per the `GEMINI.md` project mandates, Test-Driven Delivery is strictly enforced.

### Unit & Integration Tests
We will use Vitest and React Testing Library (assumed present or to be added).
- **Layout & Routing:** Test that `AppShell` correctly gates access (redirecting unauthenticated users to `/login`) and renders the `Sidebar` and `Outlet`.
- **UI Components:** Test that `Switch` and `Drawer` components render correctly and handle interactions properly.
- **Category Components:** 
  - `CategoryRow`: Test delete confirmation workflow, toggle switch functionality, and API call triggers.
  - `CategoryDrawer`: Test form validation (especially the `nom` field being required), image preview logic (showing existing URL or new file blob), and `FormData` submission.

## 2. Functional Verification
The phase is verified successfully when:
1. Running the back-office SPA locally (`npm run dev`) blocks access to `/categories` for unauthenticated users.
2. Logging in as GERANT successfully shows the AppShell with the Sidebar.
3. The `/categories` route lists categories fetched from the backend.
4. Toggling the active state of a category visually dims the row and immediately updates the backend.
5. Clicking edit pre-fills the drawer form and shows the existing image preview.
6. Changing the image shows a ≈80px preview of the newly selected file.
7. Submitting an empty `nom` is blocked by local validation.
8. Submitting valid form data updates or creates the category and refreshes the list without a page reload.
9. Clicking delete reveals an inline "Confirmer / Annuler" prompt that reverts after 3 seconds or deletes the item upon confirmation.

## 3. End-to-End Checklist
- [x] React Router implemented and gating functional.
- [x] Category list displayed correctly with images and proper order.
- [x] Drawer slides in and out smoothly.
- [x] Form data handled as multipart for image uploads.
- [x] Image preview properly implemented (D-10).
- [x] Form validations properly implemented (D-12).
- [x] TDD practices followed with test files created alongside new features and passing successfully.