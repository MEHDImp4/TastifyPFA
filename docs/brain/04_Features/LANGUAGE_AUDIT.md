# Language Audit: Tastify PFA
**Date**: 2026-05-14
**Status**: Comprehensive audit in progress.

## Overview
The application backend is correctly configured for French (`LANGUAGE_CODE = 'fr-fr'`). However, the frontend applications (`backoffice-app` and `client-app`) are currently using English for most UI labels, navigation items, and feedback messages.

---

## 1. Backend (Django)
- **Status**: ✅ OK
- **Configuration**:
  - `LANGUAGE_CODE = 'fr-fr'`
  - `USE_I18N = True`
- **Observations**: 
  - Models use French names (e.g., `Utilisateur`, `Commande`, `Plat`).
  - API endpoints are primarily in French.

---

## 2. Backoffice App (`app/frontend/backoffice-app`)
- **Status**: ❌ Needs Translation
- **Key Files**:
  - `src/layouts/Sidebar.tsx`: Navigation labels are English.
  - `src/pages/Dashboard/DashboardPage.tsx`: KPIs, headers, and alerts are English.
  - `src/pages/auth/Login.tsx`: Login form and labels.
  - All other pages (`Inventory`, `HR`, `Menu`, `Settings`, etc.) are likely in English.

### Identified Strings (Backoffice Sidebar)
- `DASHBOARD` -> `TABLEAU DE BORD`
- `FLOOR PLAN` -> `PLAN DE SALLE`
- `RESERVATIONS` -> `RÉSERVATIONS`
- `DELIVERY HUB` -> `CENTRE DE LIVRAISON`
- `MENU OPS` -> `OPÉRATIONS MENU`
- `CATEGORIES` -> `CATÉGORIES`
- `INVENTORY` -> `STOCK / INVENTAIRE`
- `STAFF MGMT` -> `GESTION RH`
- `REVIEWS` -> `AVIS CLIENTS`
- `SETTINGS` -> `PARAMÈTRES`
- `KITCHEN (KDS)` -> `CUISINE (KDS)`
- `CLOCK OUT` -> `DÉCONNEXION`

### Identified Strings (Dashboard)
- `Revenue` -> `Chiffre d'Affaires`
- `Occupancy` -> `Occupation`
- `Pending Orders` -> `Commandes en Attente`
- `Avg Prep Time` -> `Temps de Prép. Moyen`
- `Live Feed Alerts` -> `Flux d'Alertes en Direct`
- `Floor Plan Preview` -> `Aperçu du Plan de Salle`

---

## 3. Client App (`app/frontend/client-app`)
- **Status**: ❌ Needs Translation
- **Key Files**:
  - `src/layouts/PublicLayout.tsx`: Header and mobile navigation.
  - `src/pages/Home/HomePage.tsx`: Likely marketing content.
  - `src/pages/Menu/MenuPage.tsx`: Menu labels and filters.
  - `src/pages/Reservations/ReservationPage.tsx`: Booking wizard.

### Identified Strings (Public Navigation)
- `THE CATALOG` -> `LE CATALOGUE`
- `BOOKINGS` -> `RÉSERVATIONS`
- `ECHELON` -> `ÉCHELON` (Loyalty)
- `CONCIERGE` -> `CONCIERGE` (Contact)
- `Log In` -> `Connexion`
- `Authenticate` -> `S'authentifier`
- `Guest Profile` -> `Profil Client`
- `Terminate Session` -> `Se déconnecter`

---

## 4. Design System / Design MD
- **Status**: ⚠️ Review Needed
- `DESIGN.md` and `MASTER.md` should be reviewed to ensure naming conventions for UI components also reflect the French target if applicable (though code identifiers remain English).

---

## Next Steps
1. Translate `Sidebar.tsx` in Backoffice.
2. Translate `PublicLayout.tsx` in Client App.
3. Translate `DashboardPage.tsx` in Backoffice.
4. Perform deep scan of `pages/` subdirectories for further strings.
