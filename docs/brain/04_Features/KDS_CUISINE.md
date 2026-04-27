# Module: Kitchen Display System (KDS)

The KDS SPA is designed for the kitchen staff (Cuisiniers) and relies heavily on real-time WebSockets. It replaces traditional paper tickets.

## 1. Real-time Rendering
- Connects automatically to `ws://host/ws/cuisine/` on load.
- No manual page refreshes required.
- **Order Cards**: Displays table number, timestamp, and plats with their status.
- **Color Coding**:
  - `en_attente` = Gray
  - `en_preparation` = Orange
  - `pret` = Green

## 2. Plats Lifecycle
1. Cuisinier clicks "Start" -> `PATCH /api/lignes/{id}/statut/` (`en_preparation`).
2. Cuisinier clicks "Prêt" -> `PATCH /api/lignes/{id}/statut/` (`pret`).
3. Marking a plat as `pret` triggers a `plat_pret` WebSocket event to the `salle` group, alerting the waiter.

## 3. Orchestrateur de Cuisson (Synchronized Serving)
The backend calculates the exact time a dish should begin cooking so that all dishes for a single table finish at the same time.

**Formula:**
`heure_lancement = heure_commande + (max_temps_prep_commande - temps_prep_plat)`

If `heure_actuelle > heure_lancement + temps_prep`, the time is highlighted in **RED** to indicate a delay.
