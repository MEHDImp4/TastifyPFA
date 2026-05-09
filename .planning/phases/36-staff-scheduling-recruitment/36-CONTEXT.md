---
phase: 36
slug: staff-scheduling-recruitment
status: discussion
---

# Phase 36: Staff Scheduling & Recruitment

## Goal
Implement staff management features: shift scheduling (Planning) and recruitment management (Offres d'emploi).

## Context
A restaurant manager needs to organize the team's shifts and hire new staff. 
We'll extend the `hr` app with scheduling and job posting capabilities.

## Proposed Scope

### 1. Shift Scheduling (Planning)
- **Model**: `Planning` (Employé, jour, heure_debut, heure_fin).
- **UI**: Weekly grid view in Back-Office HR module.
- **Conflict detection**: Basic check for overlapping shifts for the same employee.

### 2. Recruitment Management
- **Model**: `OffreEmploi` (Titre, Description, Salaire proposé, Statut [OUVERTE, CLOSE]).
- **Model**: `Candidature` (Nom, Email, CV, Message, Offre).
- **UI (Back-Office)**: "Recrutement" tab to manage offers and applications.
- **UI (Public)**: "Rejoignez-nous" page on the Portail Client (or just a section).

## Questions for Discussion
- [ ] Should we allow employees to see their own planning? (Yes, in a simple read-only view).
- [ ] Do we need a real file upload for CVs? (Maybe just a text link/message for MVP to avoid S3/Storage complexity).

## Success Criteria
1.  Manager can assign a shift to an employee.
2.  Manager can post a job offer.
3.  Anonymous users can submit a candidatura for an offer.
