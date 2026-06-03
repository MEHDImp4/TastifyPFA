# Phase 5: Categories Frontend - Research

**Researched:** 2026-04-28 (Simulated)
**Domain:** React SPA Frontend (Back-Office Layout & Categories CRUD)
**Confidence:** HIGH

## Summary

This phase implements the core back-office application shell and the CRUD interface for categories. The architecture relies on Vite, React 18, React Router v6, and Tailwind CSS 4. The user interface features a fixed sidebar layout (`<AppShell>`), a data table for listing categories, and a slide-over drawer for creating/editing categories. 

Given the constraints, we will forgo complex libraries like TanStack Query and react-hook-form in favor of native React state management, standard controlled inputs, and raw Axios for data fetching via the pre-configured `axiosInstance`. State transitions for the drawer and the active toggle switches are handled manually.

**Primary recommendation:** Build a strong, reusable `<AppShell>` component that uses React Router's `<Outlet />` to render the main content, establishing the standard pattern for all future back-office routes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Install React Router v6 in the back-office SPA. This is the first phase that introduces real routing — do it now to avoid a disruptive refactor in Phase 7.
- **D-02:** Fixed sidebar layout: sidebar always visible on the left (≈220px), main content area on the right. No collapse toggle — the back-office targets desktop/tablet GERANTs.
- **D-03:** Sidebar style: icon + text label per section. Active route highlighted with teal accent per the ECO-FRESH design system. Navigation entries to stub out: Catégories, Plats, Tables, Stock, HR, Dashboard — all except Catégories are placeholder links (no routes yet).
- **D-04:** The authenticated shell (`<AppShell>`) is the top-level layout after login. The Login page (from Phase 3 `_shared/auth/Login`) is rendered outside the shell when `!isAuthenticated`.
- **D-05:** Data table layout. Columns: image thumbnail, Nom, Ordre d'affichage, Est active (toggle), Actions (edit + delete).
- **D-06:** The `est_active` column renders as an inline toggle switch. Clicking it sends `PATCH /api/categories/{id}/` with `{ est_active: !current }` immediately — no edit form required for toggling.
- **D-07:** The GERANT sees all categories (active and inactive) per the Phase 4 backend visibility rule. Inactive rows are visually dimmed (reduced opacity) to distinguish them.
- **D-08:** Slide-over drawer panel sliding from the right. Same `<CategoryDrawer>` component handles both create (empty form) and edit (pre-filled form). Opening the drawer for edit pre-populates all fields from the row data.
- **D-09:** Delete action uses inline confirmation: clicking the delete icon replaces the row's action buttons with "Confirmer / Annuler" for 3 seconds, then auto-reverts if no action. Soft-delete is sent via `DELETE /api/categories/{id}/` — no dialog needed since the action is reversible via toggle.
- **D-10:** Standard `<input type="file" accept="image/*">` within the drawer form. Shows a small square preview (≈80px) of the selected image before submitting. Sends as `multipart/form-data` to the API. On edit, shows the existing image URL as the current preview.
- **D-11:** No TanStack Query in Phase 5 — raw Axios + `useState`/`useEffect` is sufficient for this phase's scope. TanStack Query can be introduced when caching or optimistic updates become necessary (Phase 7+ with more complex data relationships). Use the shared `axiosInstance` from `_shared/auth/axiosInstance.ts`.
- **D-12:** No react-hook-form or Zod in Phase 5. Controlled inputs with basic required validation on `nom` (non-empty) are sufficient. Keep dependencies minimal.

### the agent's Discretion
- Exact sidebar icon set (Heroicons, Lucide, or inline SVGs): **Recommendation: `lucide-react`** (already in package.json and provides consistent stroke-based icons).
- Pagination vs. full list: **Recommendation: Full list** (categories count is small).
- Toast/notification library: **Recommendation: Lightweight custom toast or `react-hot-toast`** (since it's a simple CRUD, a custom toast context is sufficient to avoid external dependencies, or just rely on visual changes for now).
- Loading skeleton vs spinner: **Recommendation: Spinner centered in table body** (simpler for MVP).
- Exact drawer animation spec: **Recommendation: Follow `DESIGN.md`** `scale(0.95)` → `scale(1)`, 200ms ease-out via `.animate-enter` utility.

### Deferred Ideas (OUT OF SCOPE)
- **Drag-to-reorder** for `ordre_affichage` — the Gérant would drag rows to set display order. Deferred: use manual number input for now.
- **TanStack Query / react-query** — Introduce in a later phase when caching and optimistic updates become necessary.
- **Batch operations** (select multiple → bulk delete/activate) — future phase.
- **Search/filter** in the category table — future phase.
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SPA Routing | Browser | — | React Router v6 handles client-side navigation without full page reloads. |
| API Communication | Browser | — | `axiosInstance` handles token injection and API requests. |
| Authentication Guarding | Browser | — | Zustand `useAuthStore` controls visibility of `<AppShell>`. |
| CRUD Operations | API | Browser | Backend handles data validation, browser provides UI and feedback. |
| Image Upload | API | Browser | Browser sends `multipart/form-data`, API processes and stores file, returning URL. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Router DOM | `^6.30.3` | Client-side routing | D-01 constraint. Industry standard for React SPAs. |
| Axios | `^1.15.2` | API Client | Already configured in shared `axiosInstance.ts` with JWT interceptors. |
| Lucide React | `^1.11.0` (existing) | UI Icons | Clean, lightweight SVG icons that integrate well with Tailwind. |
| Tailwind CSS | `^4.0.0` | Styling | Already installed. Uses CSS custom properties from `@theme` block. |
| Zustand | `^5.0.12` | Global State | Already handles Auth. |

**Installation:**
```bash
npm install react-router-dom@^6
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/back-office/src/
├── App.tsx                  # Router root (<BrowserRouter>)
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx     # Sidebar + Main layout, auth guard
│   │   └── Sidebar.tsx      # Navigation links
│   └── ui/
│       ├── Button.tsx       # Reusable button with ECO-FRESH styling
│       ├── Drawer.tsx       # Slide-over component
│       ├── Switch.tsx       # Toggle switch for est_active
│       └── Toast.tsx        # (Optional) simple notification
├── pages/
│   └── Categories/
│       ├── index.tsx        # Page component (data fetching)
│       ├── CategoryList.tsx # Table component
│       └── CategoryDrawer.tsx # Form component
└── index.css                # Tailwind imports
```

### System Architecture Diagram
(Conceptual UI Data Flow)
```
[ Router ] --> [ AppShell (requires Auth) ]
                    ├── [ Sidebar ] (Navigation)
                    └── [ Outlet ]
                          └── [ CategoriesPage ]
                                ├── GET /api/categories/ (Axios)
                                ├── [ CategoryList (Table) ]
                                │     ├── Inline Toggle (PATCH est_active)
                                │     └── Inline Delete (DELETE /id)
                                └── [ CategoryDrawer (Form) ]
                                      └── POST/PUT (multipart/form-data)
```

### Pattern 1: Protected App Shell Layout
**What:** Using React Router to render a shared layout for authenticated users, while showing login for unauthenticated users.
**Example:**
```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../_shared/auth/useAuthStore';
import Login from '../../_shared/auth/Login';
import AppShell from './components/layout/AppShell';
import CategoriesPage from './pages/Categories';

export default function App() {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        {/* Default redirect to categories */}
        <Route index element={<Navigate to="/categories" replace />} />
        <Route path="categories" element={<CategoriesPage />} />
        {/* Placeholders for future phases */}
        <Route path="plats" element={<div>Plats (WIP)</div>} />
      </Route>
    </Routes>
  );
}
```

### Anti-Patterns to Avoid
- **Anti-pattern:** Managing form state with complex libraries (like Formik or RHF) when D-12 explicitly says not to. Use simple `useState`.
- **Anti-pattern:** Creating a new Axios instance. ALWAYS use `import { axiosInstance } from '../../_shared/auth/axiosInstance'`.
- **Anti-pattern:** Navigating with `window.location.href`. ALWAYS use `<Link>` or `useNavigate` from `react-router-dom`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Client Routing | Custom `window.history` manager | `react-router-dom` | Handles nested routes, layout sharing via Outlet natively. |
| Icons | Custom SVGs for common UI | `lucide-react` | Faster development, consistent sizing and stroke widths. |

**Key insight:** D-11 and D-12 explicitly instruct us TO hand-roll data fetching and forms for this specific phase to avoid over-engineering. Do what the constraints say.

## Common Pitfalls

### Pitfall 1: Form Data and Image Uploads
**What goes wrong:** The API receives empty image data or rejects the request because the `Content-Type` is set to `application/json`.
**Why it happens:** You tried to send a file using JSON instead of `multipart/form-data`.
**How to avoid:**
```typescript
const formData = new FormData();
formData.append('nom', nom);
if (imageFile) {
  formData.append('image', imageFile);
}
await axiosInstance.post('/api/categories/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Pitfall 2: React Router v6 Outlet Missing
**What goes wrong:** The sidebar renders but the page content is blank.
**Why it happens:** The `<AppShell>` component does not include `<Outlet />`.
**How to avoid:** Make sure the layout component renders `<Outlet />` where child route components should appear.

### Pitfall 3: Inline Delete Confirmation State
**What goes wrong:** Clicking delete on one row changes the state of all rows.
**Why it happens:** The "is confirming delete" state is held in the parent table instead of the individual row component.
**How to avoid:** Create a `<CategoryRow>` component that manages its own `isConfirming` state and 3-second timeout.

## Code Examples

### Controlled Toggle Switch (Est Active)
```tsx
import { useState } from 'react';
import { axiosInstance } from '../../_shared/auth/axiosInstance';

export function ActiveToggle({ categoryId, initialStatus }) {
  const [isActive, setIsActive] = useState(initialStatus);

  const toggle = async () => {
    const nextStatus = !isActive;
    setIsActive(nextStatus); // Optimistic UI
    try {
      await axiosInstance.patch(`/api/categories/${categoryId}/`, { est_active: nextStatus });
    } catch (err) {
      setIsActive(!nextStatus); // Revert on failure
      console.error("Toggle failed", err);
    }
  };

  return (
    <button onClick={toggle} className={`w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-teal-500' : 'bg-surface-elevated'}`}>
      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isActive ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
}
```

### Inline Delete Row Component
```tsx
function CategoryRow({ category, onDeleteSuccess }) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDeleteClick = () => setIsConfirming(true);
  
  const handleConfirm = async () => {
    await axiosInstance.delete(`/api/categories/${category.id}/`);
    onDeleteSuccess(); // Refresh list or remove from state
  };

  const handleCancel = () => setIsConfirming(false);

  // Auto-revert timeout
  useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => setIsConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirming]);

  return (
    <tr className={category.est_active ? '' : 'opacity-50'}>
      {/* ... cells ... */}
      <td>
        {isConfirming ? (
           <div className="flex gap-2">
             <button onClick={handleConfirm} className="text-error">Confirmer</button>
             <button onClick={handleCancel}>Annuler</button>
           </div>
        ) : (
           <div className="flex gap-2">
             <button onClick={() => onEdit(category)}>Edit</button>
             <button onClick={handleDeleteClick}>Delete</button>
           </div>
        )}
      </td>
    </tr>
  );
}
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node/npm | Frontend | ✓ | 20+ | — |
| React Router v6| Layout | ✗ | — | Add to package.json |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library (Expected setup) |
| Config file | `vite.config.ts` (requires configuration) |
| Quick run command | `npm test` |
| Full suite command | `npm run test` |

*(Note: If tests were not initialized in Wave 0, focus on manual verification and smoke tests via UI or simple e2e).*

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01 | React Router correctly routes to `/categories` | Unit/Integration | `npm test` | ❌ |
| D-04 | AppShell redirects unauthenticated users | Unit | `npm test` | ❌ |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Handled by `useAuthStore` protecting routes |
| V4 Access Control | yes | Ensure UI hides actions if not `GERANT` |
| V5 Input Validation | yes | Controlled components, prevent XSS on text render |

### Known Threat Patterns for React
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via user input | Tampering | React auto-escapes text values. Do not use `dangerouslySetInnerHTML`. |
| CSRF / Auth Bypass | Elevation | Ensure `axiosInstance` sends tokens on every request. |
