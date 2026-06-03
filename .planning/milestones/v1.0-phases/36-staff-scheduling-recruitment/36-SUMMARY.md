---
phase: 36
slug: staff-scheduling-recruitment
status: complete
---

# Phase 36 Summary: Staff Scheduling & Recruitment

## Work Completed

### 1. HR Data Model Extensions
- **Scheduling**: Added `Shift` model to the `hr` app to handle employee working hours with built-in overlap validation.
- **Recruitment**: Implemented `OffreEmploi` and `Candidature` models to manage the hiring pipeline.
- **Database**: Applied migrations to initialize the new schema.

### 2. HR API & RBAC
- **Endpoints**: Registered ViewSets for Shifts, Job Offers, and Candidatures in the centralized API router.
- **Security**: 
  - `GERANT`: Full CRUD access to all HR modules.
  - `STAFF`: Read-only access to their own shifts.
  - `ANONYMOUS`: Ability to submit candidatures for published offers.
- **Validation**: Added custom serializer logic to prevent overlapping shifts for the same employee.

### 3. Back-Office HR Dashboard
- **Tabs**: Upgraded `HrPage` with a tabbed interface (Effectif, Planning, Recrutement).
- **Planning Module**: Created a weekly grid view component for shift management.
- **Recruitment Module**: Developed a dedicated module to manage job postings and track applicant motivation and contact details.

## Verification Results
- **Automated Tests**: `test_hr_extensions.py` verified:
  - Successful shift creation.
  - Prevention of overlapping shifts (400 Bad Request).
  - Public submission of candidatures.
- **Build**: Production build passes for Back-Office.

## Next Steps
- **Phase 37**: AI Weather-Aware Stock Forecasting (UC29).
