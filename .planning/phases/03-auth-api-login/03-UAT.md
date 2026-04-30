# Phase 03 UAT: Auth API & Login Page

## Status: IN_PROGRESS
Started: 2026-04-30

## Test Cases

| ID | Feature | Description | Status | Notes |
|---|---|---|---|---|
| UAT-03-01 | Role-based Redirect (Gerant) | Login as `gerant_test` redirects to the Back-Office (Tables/Plats view). | PENDING | |
| UAT-03-02 | Role-based Redirect (Serveur) | Login as `serveur_test` redirects directly to the `/salle` map view. | PENDING | |
| UAT-03-03 | Role-based Redirect (Cuisinier)| Login as `cuisinier_test` redirects directly to the `/kds` kitchen view. | PENDING | |
| UAT-03-04 | Unauthorized Access Guard | A Client cannot log in to the staff port (3000), and a Staff member cannot log in to the client port (3003). | PENDING | |
| UAT-03-05 | Logout Functionality | Clicking "Se déconnecter" clears the session and returns the user to the login screen. | PENDING | |

## Issues & Diagnosis
*No issues found yet.*

## Fix Plans
*No fix plans required yet.*
