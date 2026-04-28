---
phase: 09-tables-map-frontend
type: context
status: final
last_updated: "2026-04-28T23:55:00.000Z"
---

# Phase 9: Tables Map Frontend — Context

## Goal
Implement an interactive, draggable floor map in the **Interface Salle** (`frontend/salle/`) that allows Gérants to manage room layout and Waiters to visualize table statuses.

## Success Criteria
1. **Interactive Map:** Users see a visual grid/map of tables colored by status (LIBRE, OCCUPEE, etc.).
2. **Map Editor (GERANT):**
   - Toggleable "Mode Edition" button.
   - Drag-and-drop support with **20px grid snapping**.
   - Batch-save persistence (global "Enregistrer" button).
3. **Dynamic Shapes:**
   - Capacity <= 4: Rendered as Circles.
   - Capacity > 4: Rendered as Rounded Rectangles.
4. **Collision Feedback:** Overlapping tables show a Red Glow visual warning (no hard block).
5. **Touch Friendly:** Editor works on tablets but is guarded by the Lock/Unlock toggle.

## Key Technical Decisions
- **D-09-01: Grid Snapping:** Snap to 20px increments on a 1000x800 SVG coordinate system.
- **D-09-02: Persistence:** Batch save via individual `PATCH /api/tables/{id}/` requests for dirty tables.
- **D-09-03: Visuals:** 
  - LIBRE: `#2A9D8F` (Teal)
  - OCCUPEE: `#E76F51` (Red/Coral)
  - RESERVEE: `#264653` (Dark Slate)
  - ENCAISSEMENT: `#E9C46A` (Amber)
- **D-09-04: RBAC Editor:** Map Editor controls only visible and functional for users with `GERANT` role.

## Component Architecture
- `MapView.tsx`: Manages page state (edit mode, dirty state, API polling).
- `TableMap.tsx`: The SVG container handling coordinate scaling and background grid.
- `TableItem.tsx`: Individual table element (Rect/Circle) with drag logic and status styling.

## Required Reading
- `backend/apps/tables/models.py` (Table fields: `pos_x`, `pos_y`, `numero`, `capacite`)
- `DESIGN.md` (Gradients and motion standards)
