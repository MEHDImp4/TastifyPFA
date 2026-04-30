# Phase 03 UAT: Auth API & Login Page

## Status: COMPLETED
Started: 2026-04-30
Completed: 2026-04-30

## Test Cases

| ID | Feature | Description | Status | Notes |
|---|---|---|---|---|
| UAT-03-01 | Role-based Redirect (Gerant) | Login as `gerant_test` redirects to the Back-Office (Tables/Plats view). | PASSED | Verified by user. |
| UAT-03-02 | Role-based Redirect (Serveur) | Login as `serveur_test` redirects directly to the `/salle` map view. | PASSED | Verified by user. |
| UAT-03-03 | Role-based Redirect (Cuisinier)| Login as `cuisinier_test` redirects directly to the `/kds` kitchen view. | PASSED | Verified by user. |
| UAT-03-04 | Unauthorized Access Guard | A Client cannot log in to the staff port (3000), and a Staff member cannot log in to the client port (3003). | PASSED | Fixed: Added error message persistence when cross-portal sessions are cleared. |
| UAT-03-05 | Logout Functionality | Clicking "Se déconnecter" clears the session and returns the user to the login screen. | PASSED | Verified by user. |

## Issues & Diagnosis
*No issues found yet.*

## Fix Plans
*No fix plans required yet.*
