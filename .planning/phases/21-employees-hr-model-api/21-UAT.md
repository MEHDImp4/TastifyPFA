---
status: PASSED
phase: 21-employees-hr-model-api
started: 2026-05-05T22:15:00+01:00
updated: 2026-05-05T22:35:00+01:00
tests:
  - id: 21-01
    title: "Création d'un employé via l'Admin Django"
    expected: "L'employé est créé et un utilisateur Django lié est automatiquement généré avec le bon rôle."
    status: PASSED
  - id: 21-02
    title: "Vérification du RBAC API"
    expected: "L'accès à /api/employes/ est autorisé pour le GERANT et refusé (403) pour les autres rôles."
    status: PASSED
  - id: 21-03
    title: "Soft Delete (Désactivation)"
    expected: "La suppression d'un employé via l'API désactive son compte utilisateur (is_active=False)."
    status: PASSED
---

# Phase 21 Verification: Employees (HR) Model & API

## Status: PASSED

Session completed. All backend HR logic, including RBAC and automated user deactivation, is verified and functional.
