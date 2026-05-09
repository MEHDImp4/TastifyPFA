---
phase: 36
slug: staff-scheduling-recruitment
status: research
---

# Phase 36 Research: HR Extensions

## Planning Model
- `Planning` needs to handle recurring shifts? (Maybe too complex, start with date-specific).
- `jour`: Date field.
- `heure_debut`, `heure_fin`: Time fields.

## Recruitment Models
- `OffreEmploi`:
  - `titre`, `description`, `type_contrat` (CDI, CDD, Saisonnier).
  - `est_publiee`: Boolean.
- `Candidature`:
  - `nom_complet`, `email`, `telephone`, `message_motivation`.
  - `statut`: (NOUVELLE, ENTRETENUE, REFUSEE, RECRUTEE).

## UI Requirements
- **Scheduling**: A grid-based calendar view. Using `lucide-react` icons for shift types.
- **Recruitment**: Simple CRUD list for offers, and a detail view for applications.

## Permissions
- `GERANT`: Full CRUD.
- `STAFF`: Read-only planning for self.
- `ANONYMOUS`: Post candidatura.
