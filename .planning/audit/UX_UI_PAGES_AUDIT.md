# INVENTAIRE EXHAUSTIF DES PAGES, UX/UI ET FONCTIONNALITÉS - TASTIFY PFA

## ÉTAPE 1 — SCAN COMPLET DU PROJET

**Structure & Technologies :**
- **Architecture :** Monorepo (Backoffice App + Client App).
- **Framework :** React 19, React Router v7, Vite.
- **Styling :** Tailwind CSS v4, Framer Motion (Animations), CSS Variables Custom.
- **State Management :** Zustand.
- **Icônes :** Lucide React.
- **Routing :** React Router DOM (avec `BrowserRouter`, `Routes`, `Route`, guards et layouts partagés).

**Structure des dossiers principaux :**
- `app/frontend/backoffice-app/src/`
  - `pages/` (Avis, Categories, Dashboard, HR, Inventory, Menu, Settings, Staff, auth)
  - `layouts/` (AppShell, Sidebar, Topbar)
  - `components/` (auth, ui)
- `app/frontend/client-app/src/`
  - `pages/` (Account, Checkout, Contact, Home, Menu, Payment, Reservations, auth)
  - `layouts/` (PublicLayout)
  - `components/` (auth, branding, ui)

**Gestion de l'authentification et des Rôles :**
- `ProtectedRoute` / `GuestRoute` / `RoleRoute`
- **Rôles gérés :** `GERANT` (Admin global), `SERVEUR` (Salle, Réservations), `CUISINIER` (KDS, Menu), `CLIENT` (Portail public).

---

## ÉTAPE 2 — INVENTAIRE EXHAUSTIF DES PAGES

### 📂 APPLICATION CLIENT (Portail Public)

#### 1. Portail Home (Landing Page)
- **Route :** `/`
- **Fichier :** `client-app/src/pages/Home/PortalHomePage.tsx`
- **Type :** Publique
- **Layout :** `PublicLayout`
- **Statut :** Utilisée
- **Fonctionnalités :** 
  - Affichage des plats recommandés (Top 3 via API).
  - Navigation vers Menu, Reservations.
- **UX actuelle :** Accueil "Editorial", orientation premium/luxe avec typographie grand format. Navigation via une "navbar" qui se collapse en mobile.
- **UI actuelle :** Minimaliste. Grosse typographie serif italic. Backgrounds transparents. Boutons avec effets `cinematic-shadow`.
- **États à prévoir :** Loading (Skeleton des plats), Empty state (si pas de recommandations), Hover sur les plats/boutons.

#### 2. Le Menu / Catalogue
- **Route :** `/menu`
- **Fichier :** `client-app/src/pages/Menu/MenuPage.tsx`
- **Type :** Publique
- **Layout :** `PublicLayout`
- **Statut :** Utilisée
- **Fonctionnalités :** 
  - Liste des catégories.
  - Filtre par catégorie (Sidebar).
  - Barre de recherche en temps réel.
  - Ajout au panier (`useCartStore`).
  - Modale de détail du plat avec "Orchestration Window" (Temps prép) et "Session Value" (Prix).
- **UX actuelle :** Sidebar sticky à gauche avec liste des catégories. Grille d'images. Expérience "Editorial" (The Manifest).
- **UI actuelle :** Grille responsive. Effets de filtre grayscale sur les images (0.2 -> 0 au hover). Modale plein écran ou large `Modal`.
- **États à prévoir :** Loading state (Skeletons complets implémentés), Empty state (recherche sans résultat : "No matches detected"), Modale ouverte/fermée, Sélection de catégorie active.

#### 3. Réservation (Wizard)
- **Route :** `/reservations`
- **Fichier :** `client-app/src/pages/Reservations/ReservationWizard.tsx`
- **Type :** Publique (Accès partiel/complet selon Auth)
- **Layout :** `PublicLayout`
- **Statut :** Utilisée
- **Fonctionnalités :** 
  - Processus multi-étapes (Wizard).
  - Sélection date, heure, nombre de personnes.
- **UX actuelle :** Flow guidé. Formulaires fragmentés pour réduire la friction cognitive.
- **États à prévoir :** Étapes du Wizard (1, 2, 3), Loading de la soumission, Message de succès/erreur, Validation des champs.

#### 4. Contact / Concierge
- **Route :** `/contact`
- **Fichier :** `client-app/src/pages/Contact/ContactPage.tsx`
- **Type :** Publique
- **Layout :** `PublicLayout`
- **Statut :** Utilisée
- **Fonctionnalités :** Formulaire de contact, infos du restaurant (Tel, adresse, etc.).
- **États à prévoir :** Validation formulaire, Loading soumission.

#### 5. Panier / Checkout
- **Route :** `/checkout`
- **Fichier :** `client-app/src/pages/Checkout/CheckoutPage.tsx`
- **Type :** Publique/Privée
- **Layout :** `PublicLayout`
- **Statut :** Utilisée
- **Fonctionnalités :** 
  - Liste des items du panier.
  - Modification quantité (+/-) et suppression.
  - Calcul sous-total, taxes (8%), et pourboires dynamiques (10%, 15%, 20%, 25%).
  - Action : "Authorize Manifest" (Création commande type EMPORTER).
- **UX/UI actuelle :** Séparation en 2 colonnes (items à gauche, Total "Settlement" à droite). Carte de total noire/foncée contrastante.
- **États à prévoir :** Panier vide ("Your palette is waiting"), Confirmation succès ("Manifest Secured" full page), Bouton Submit Loading.

#### 6. Espace Client (Account)
- **Route :** `/account`
- **Fichier :** `client-app/src/pages/Account/AccountPage.tsx`
- **Type :** Privée (CLIENT)
- **Layout :** `PublicLayout`
- **Statut :** Utilisée
- **Fonctionnalités :** 
  - Affichage infos utilisateur (Loyalty Profile).
  - Historique des commandes/réservations.
  - Système d'avis (`avisApi`).
- **États à prévoir :** Loading profil, affichage des points/statut, historique vide.

#### 7. Authentification Client (Login / Register)
- **Routes :** `/login`, `/register`
- **Fichiers :** `client-app/src/pages/auth/Login.tsx`, `client-app/src/pages/auth/Register.tsx`
- **Type :** Publique (GuestRoute)
- **Layout :** `PublicLayout`
- **Statut :** Utilisée
- **Fonctionnalités :** Connexion et inscription (`useAuthStore`).
- **États à prévoir :** Loading (spinner), Erreurs API affichées, focus inputs.

#### 8. Portail de Paiement (Split Bill / QR)
- **Route :** `/pay/:token`
- **Fichier :** `client-app/src/pages/Payment/PaymentPortal.tsx`
- **Type :** Publique (via lien/token QR)
- **Layout :** `PublicLayout`
- **Statut :** Utilisée
- **Fonctionnalités :** 
  - Interface de paiement dématérialisée.
  - Mode de séparation de l'addition (ALL, EQUAL, INDIVIDUAL).
- **États à prévoir :** Loading session, Sélecteur de mode de paiement (Tabs/Boutons), Confirmation de succès, Erreur token.

---

### 💼 APPLICATION BACKOFFICE (Staff OS)

#### 1. Dashboard (Live Dashboard)
- **Route :** `/`
- **Fichier :** `backoffice-app/src/pages/Dashboard/DashboardPage.tsx`
- **Type :** Privée (GERANT)
- **Layout :** `AppShell` -> `Sidebar`, `Topbar`
- **Statut :** Utilisée
- **Fonctionnalités :** 
  - KPIs en temps réel (CA, Occupation, Commandes en attente, Temps de prep).
  - Flux d'orchestration de la cuisine (Tableau des commandes KDS).
  - Tops plats, Alertes critiques/Live Feed, Vue d'ensemble du plan de salle alpha.
- **UX/UI actuelle :** Dashboard très "Tactique" / Militaire / Command Center. Beaucoup de bordures (2px border-on-surface), uppercase, polices condensées, ombres dures (`shadow-[4px_4px_0px...]`).
- **États à prévoir :** Skeleton complets de KPIs et tableaux, Alertes pulse, Loading données temps réel (WebSocket).

#### 2. Plan de Salle (Main Salle)
- **Route :** `/salle`
- **Fichier :** `backoffice-app/src/pages/Staff/SallePage.tsx`
- **Type :** Privée (GERANT, SERVEUR)
- **Layout :** `AppShell`
- **Statut :** Utilisée
- **Fonctionnalités :** 
  - Grille 2D des tables drag & drop (`pos_x`, `pos_y`).
  - Statuts visuels (Libre, Occupée, Réservée, Encaissement).
  - Accès à la prise de commande par clic sur la table.
  - Mode Édition (Ajout, Déplacement, Modification capacité, Suppression table/texte).
- **UX/UI actuelle :** Fond quadrillé radial. Boutons d'édition tactiques. Modales overlay floutées (`#301400/80`). 
- **États à prévoir :** Drag&Drop en cours, Modale d'édition, Loading data, Hover/Active sur les tables.

#### 3. Prise de Commande
- **Route :** `/ordering/:tableId`
- **Fichier :** `backoffice-app/src/pages/Staff/OrderingPage.tsx`
- **Type :** Privée (GERANT, SERVEUR)
- **Layout :** (Hors AppShell classique, Vue Focusée "min-h-[100dvh]")
- **Statut :** Utilisée
- **Fonctionnalités :** Ajout de plats à une table spécifique. Tri priorités de ligne.
- **États à prévoir :** Catalogue produits, sélection de notes, Confirmation.

#### 4. KDS (Kitchen Display System)
- **Route :** `/kds`
- **Fichier :** `backoffice-app/src/pages/Staff/KdsPage.tsx`
- **Type :** Privée (GERANT, CUISINIER)
- **Layout :** `AppShell`
- **Statut :** Utilisée
- **Fonctionnalités :** 
  - Board Kanban (Incoming, In Progress, Ready, Critical).
  - Validation ligne par ligne.
  - Calcul temps écoulé (pulse rouge si > 15min).
  - Alerte sonore (bip) à l'arrivée d'un ticket.
- **États à prévoir :** Drag&drop statuts ou clic de validation, Pulse animations sur Critical, Barres de progression, Colonnes vides.

#### 5. Menu & Plats (Menu Architecture)
- **Route :** `/menu`
- **Fichier :** `backoffice-app/src/pages/Menu/PlatPage.tsx`
- **Type :** Privée (GERANT, CUISINIER)
- **Layout :** `AppShell`
- **Statut :** Utilisée
- **Fonctionnalités :** CRUD Plats (Création, liste, modification, upload d'image, gestion stock ingrédients). Modale détaillée.

#### 6. Catégories
- **Route :** `/categories`
- **Fichier :** `backoffice-app/src/pages/Categories/CategoryPage.tsx`
- **Type :** Privée (GERANT)
- **Layout :** `AppShell`
- **Statut :** Utilisée
- **Fonctionnalités :** CRUD Catégories, upload image, gestion ordre affichage.
- **États à prévoir :** Skeletons Cards, Modale de création/édition.

#### 7. Stock / Inventaire
- **Route :** `/stock`
- **Fichier :** `backoffice-app/src/pages/Inventory/StockPage.tsx`
- **Type :** Privée (GERANT)
- **Layout :** `AppShell`
- **Statut :** Utilisée
- **Fonctionnalités :** Gestion des ingrédients, alertes seuil bas, ajustements manuels.

#### 8. Réservations (Staff View)
- **Route :** `/reservations`
- **Fichier :** `backoffice-app/src/pages/Staff/ReservationsPage.tsx`
- **Type :** Privée (GERANT, SERVEUR)
- **Layout :** `AppShell`
- **Statut :** Utilisée
- **Fonctionnalités :** Tableau de bord des réservations, approbation/rejet/assignation table.

#### 9. Personnel (RH)
- **Route :** `/hr`
- **Fichier :** `backoffice-app/src/pages/HR/HrPage.tsx`
- **Type :** Privée (GERANT)
- **Layout :** `AppShell`
- **Statut :** Utilisée
- **Fonctionnalités :** Liste des employés, rôles, salaires, contrats.

#### 10. Avis Clients
- **Route :** `/avis`
- **Fichier :** `backoffice-app/src/pages/Avis/AvisPage.tsx`
- **Type :** Privée (GERANT)
- **Layout :** `AppShell`
- **Statut :** Utilisée
- **Fonctionnalités :** Dashboard NLP/Sentiment analysis des retours clients.

#### 11. Paramètres (Configuration)
- **Route :** `/settings`
- **Fichier :** `backoffice-app/src/pages/Settings/SettingsPage.tsx`
- **Type :** Privée (GERANT)
- **Layout :** `AppShell`
- **Statut :** Utilisée
- **Fonctionnalités :** Update info resto (logo, nom, adresse, email).

#### 12. Authentification Backoffice
- **Route :** `/login`
- **Fichier :** `backoffice-app/src/pages/auth/Login.tsx`
- **Type :** Publique (Redirection si déjà auth)
- **Layout :** Sans AppShell
- **Statut :** Utilisée
- **Fonctionnalités :** Login STAFF.

### 🧩 COMPOSANTS TRANSVERSES (UI STATES)
- **Modales (`Modal.tsx`) :** Overlay backdrop-blur, animation zoom-in, fermeture ESC. Utilisée partout dans le backoffice.
- **Skeletons (`Skeleton.tsx`) :** `CardSkeleton`, `TableRowSkeleton`, `KpiSkeleton` pour le chargement unifié.
- **Toaster (`sonner`) :** Utilisé globalement pour les retours de succès ou d'erreurs d'API.
- **Layouts (`Sidebar`, `Topbar`, `PublicLayout`) :** Gèrent le collapse menu, la navigation rôle, le profil connecté, le panier.

---

## 🛠 RECOMMANDATIONS GÉNÉRALES REDESIGN / AUDIT

1. **Cohérence Visuelle :**
   - L'application Client possède un style "Editorial, Premium, Editorial-Kicker" (Gros serif italique, borders minimales, ombres douces `cinematic-shadow`).
   - L'application Backoffice a un style "Tactical Brutalist" (Bords 2px, couleurs dures `bg-[#301400]`, uppercase, text dense `[10px]`).
   - *Assurer que ce contraste voulu est bien maintenu, mais vérifier l'accessibilité sur les écrans très denses comme le Dashboard (font size 9/10px peut être dur à lire pour certains utilisateurs).*

2. **États Manquants ou à Améliorer :**
   - **Offline State :** Vite PWA est installé, mais aucun message clair de mode hors-ligne détecté visuellement dans la plupart des pages (à valider sur `SocketIndicator`).
   - **Empty States Illustrés :** Actuellement très textuels ("No matches detected" avec juste une icône). Gagnerait à avoir des SVG de placeholders selon le thème (ex: table vide stylisée pour le KDS).

3. **Routing Mobile Backoffice :**
   - L'`OrderingPage` est séparée de l'`AppShell` pour un mode Focus. Excellent pour le mobile.
   - S'assurer que le `Sidebar.tsx` (Backoffice) en mode mobile se ferme bien après chaque navigation ou action modale.
