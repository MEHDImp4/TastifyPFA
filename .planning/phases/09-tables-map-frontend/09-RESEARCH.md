# Phase 9: Tables Map Frontend — Research

**Gathered:** 2026-04-28
**Confidence key:** HIGH = verified in codebase / docs · MEDIUM = inferred from patterns · LOW = assumed

---

## 1. Goal
Implement an interactive SVG-based floor plan in the **Salle UI** that visualizes tables and their real-time (initially polling) statuses.

## 2. API Contract (Verified from Phase 8)
**Endpoint:** `GET /api/tables/`
**Response Shape:**
```json
{
  "id": 1,
  "numero": 1,
  "capacite": 4,
  "statut": "LIBRE",
  "pos_x": 0.0,
  "pos_y": 0.0,
  "est_active": true
}
```
**Statut Enum:** `LIBRE`, `OCCUPEE`, `RESERVEE`, `ENCAISSEMENT`.

## 3. Map Visual Design (LOCKED: D-09-01)
- **Container:** A responsive SVG viewport with a defined coordinate system (e.g., 1000x800).
- **Table Representation:** 
  - Circles or Rectangles based on capacity/shape (simplification: all Rect for now).
  - Label: Table number in center.
  - Colors (Tailwind mapped):
    - `LIBRE`: `bg-teal-500` (#2A9D8F)
    - `OCCUPEE`: `bg-red-500` (#E76F51)
    - `RESERVEE`: `bg-slate-700` (#264653)
    - `ENCAISSEMENT`: `bg-amber-500` (#E9C46A)

## 4. Interaction Logic
- **Hover:** Slight scale increase and shadow.
- **Click:** Open a Modal/Sidebar (Phase 12 placeholder).
- **Responsive:** 
  - On desktop: Full map.
  - On mobile: Panning support or a simplified list fallback.

## 5. Technology Choices
- **SVG Elements:** `<rect>`, `<text>`, `<g>`.
- **Styling:** Tailwind for colors, Framer Motion for status transitions (e.g., color morphing).
- **Positioning:** Since `pos_x`/`pos_y` are seeded as `0,0`, this phase must include a **GERANT editor mode** or a **default grid generator** if no positions are set.
- **LOCKED Decision (D-09-02):** If `pos_x` and `pos_y` are both 0.0, generate a default grid layout for visualization.

## 6. Development Strategy
1. Create shared table types in `frontend/_shared/types/tables.ts`.
2. Build `TableMap` component in `frontend/salle/src/components/map/`.
3. Implement `MapView` page in `frontend/salle/src/pages/Map/`.
4. Add basic "Move" logic (GERANT only) to update `pos_x`/`pos_y` via `PATCH`.

## 7. Dependencies Check
- `lucide-react`: Present.
- `axiosInstance`: Present.
- `framer-motion`: Need to check `frontend/salle/package.json`.
- `react-use-gesture`: Not currently present.

## 8. Open Questions
- [ ] Should we use a fixed 1:1 pixel coordinate or a percentage-based layout? (Decision: 1000-unit arbitrary scale).
- [ ] Is a GERANT "Position Editor" required in Phase 9 or just a grid? (Decision: Basic drag-and-drop for GERANT is highly valuable for UX).
