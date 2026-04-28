---
phase: 09-tables-map-frontend
type: context
status: draft
---

# Phase 9: Tables Map Frontend — Context

## Goal
Implement an interactive floor map in the **Interface Salle** (`frontend/salle/`) using SVG. 
This map will visualize seeded tables (1-12) from Phase 8, representing their physical positions (`pos_x`, `pos_y`) and statuses (`statut`).

## Success Criteria
1. Interface Salle authenticated users see a visual grid/map of tables.
2. Tables are colored by status:
   - `LIBRE`: Green (#2A9D8F)
   - `OCCUPEE`: Red (#E76F51)
   - `RESERVEE`: Blue (#264653 / Indigo)
   - `ENCAISSEMENT`: Amber (#E9C46A)
3. Clicking a table opens a placeholder modal/sidebar (for Phase 12 ordering).
4. Responsive: Map scales or scrolls correctly on tablets/handhelds.
5. Real-time ready: Prepared for WebSocket updates (Phase 13).

## Depends on
- Phase 3 (Auth Infrastructure)
- Phase 8 (Tables API & Seed Data)

## Key Technical Decisions
- **SVG vs Canvas**: SVG is preferred for interactivity and ease of styling with Tailwind/React.
- **Draggable Positions**: In this phase, positions are read-only (seeded as 0,0). A GERANT "Map Editor" mode might be considered for a later sub-phase or defered.
- **Responsive Layout**: Map container should handle panning/zooming if the floor is larger than the screen.

## Required Reading
- `docs/cahier_de_charge_tastify.md` Section 5.3.1 (Plan de Salle Interactif)
- `backend/apps/tables/models.py` (Table fields)
- `DESIGN.md` (Colors and animations)
