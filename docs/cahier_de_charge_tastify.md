# TASTIFY — Cahier de Charges Avancé
**ERP de Gestion de Restaurant — Intelligence Artificielle**

> **Version :** 1.0 — Avril 2026  
> **Réalisé par :** Diouri Mehdi & El Kharrazi Ibtihal  
> **Établissement :** EMSI Innovation — École Marocaine des Sciences de l'Ingénieur  
> **Destinataires :** Équipe ingénieurs Tastify  
> **Statut :** CONFIDENTIEL — Usage interne

---

## Table des Matières

1. [Présentation du Projet](#1-présentation-du-projet)
2. [Modèle de Rôles et Permissions (RBAC)](#2-modèle-de-rôles-et-permissions-rbac)
3. [Spécifications des Endpoints API](#3-spécifications-des-endpoints-api)
4. [Modèle de Données — Contraintes d'Implémentation](#4-modèle-de-données--contraintes-dimplémentation)
5. [Spécifications Fonctionnelles par Module](#5-spécifications-fonctionnelles-par-module)
6. [Spécifications Sécurité](#6-spécifications-sécurité)
7. [Architecture de Déploiement Docker](#7-architecture-de-déploiement-docker)
8. [Stratégie de Tests](#8-stratégie-de-tests)
9. [Standards de Développement](#9-standards-de-développement)
10. [Livrables et Critères de Réception](#10-livrables-et-critères-de-réception)
- [Annexe A — Environnement de Développement Local](#annexe-a--environnement-de-développement-local)
- [Annexe B — Glossaire Technique](#annexe-b--glossaire-technique)

---

## 1. Présentation du Projet

### 1.1 Contexte et Objectifs

Tastify est un ERP web full-stack dédié à la gestion des restaurants marocains. Il cible les PME qui ne peuvent pas se permettre les solutions leaders du marché (Lightspeed, Toast POS, Revel Systems) dont les tarifs débutent à 600 MAD/mois. Ce cahier de charges définit précisément ce que chaque ingénieur doit implémenter, selon quels standards et avec quels critères d'acceptation.

> **Périmètre fonctionnel — 4 modules à livrer**
> - **Module 1 — Back-Office Gérant :** menu, stocks, RH, tableaux de bord
> - **Module 2 — Front-Office Cuisine :** KDS (Kitchen Display System) WebSocket temps réel
> - **Module 3 — Front-Office Salle :** plan de salle interactif, prise de commande, QR paiement
> - **Module 4 — Portail Client :** réservations, menu en ligne, recommandation IA, fidélité

---

### 1.2 Stack Technologique — Versions Figées

| Composant | Technologie | Version | Rôle |
|---|---|---|---|
| Backend API | Django + DRF | 5.0 / 3.15 | API REST — MVT + ORM |
| WebSocket | Django Channels + Daphne | 4.x / 4.x | KDS temps réel |
| Task Queue | Celery + Beat | 5.x | Tâches async + cron IA |
| Message Broker | Redis | 7-alpine | Broker Celery + Channel Layer |
| Base de données | MySQL | 8.0 | SGBD principal |
| Frontend | React 18 + Vite | 18.x / 5.x | 4 SPA découplées |
| Styles | Tailwind CSS | 3.x | Design system ECO-FRESH |
| Auth | djangorestframework-simplejwt | 5.x | JWT access+refresh |
| IA — Reco | scikit-learn | 1.x | Collaborative filtering |
| IA — Sentiment | HuggingFace Transformers | 4.x | BERT multilingue |
| Infra | Docker Compose | 3.9 | Orchestration services |
| Reverse Proxy | Nginx | alpine | Sert React + proxifie API |
| CI Tests | pytest + pytest-django | latest | Tests unitaires + intégration |
| PWA | vite-plugin-pwa + Workbox | latest | Cache offline Interface Serveur |

---

### 1.3 Architecture Globale

L'architecture repose sur une séparation stricte backend/frontend :

- Django DRF expose uniquement des endpoints JSON (pas de templates HTML en production).
- 4 apps React indépendantes (Gérant, Cuisine, Salle, Client) consomment l'API via HTTP + WebSocket.
- L'authentification JWT est portée dans l'en-tête `Authorization: Bearer <token>` à chaque requête.
- Redis joue le double rôle de broker Celery ET de Channel Layer Django Channels pour les WebSockets.
- Nginx sert les builds React en statique et proxifie `/api/` vers Gunicorn, `/ws/` vers Daphne.

> ⚠️ **Contrainte absolue — Découplage**
> - Le backend Django ne doit **JAMAIS** rendre de templates HTML en production.
> - Tous les échanges de données se font via JSON (DRF) ou via WebSocket (Django Channels).
> - La gestion des tokens JWT est côté React uniquement — le refresh token est stocké en cookie HttpOnly (pas de localStorage).

---

## 2. Modèle de Rôles et Permissions (RBAC)

### 2.1 Définition des Rôles

| Rôle | Code Django | Interface | Niveau d'accès |
|---|---|---|---|
| Gérant | `GERANT` | React Back-Office | Toutes opérations CRUD + rapports + config IA |
| Serveur | `SERVEUR` | React Salle | Tables, commandes, QR paiement — lecture stocks |
| Cuisinier | `CUISINIER` | React KDS | Lecture commandes, mise à jour statuts plats |
| Client | `CLIENT` | React Portail | Réservation, commande, profil, fidélité |

---

### 2.2 Matrice des Permissions par Endpoint

| Endpoint DRF | Gérant | Serveur | Cuisinier | Client |
|---|---|---|---|---|
| `GET /api/plats/` | ✓ | ✓ | ✓ | ✓ |
| `POST /api/plats/` | ✓ | ✗ | ✗ | ✗ |
| `PUT /api/plats/{id}/` | ✓ | ✗ | ✗ | ✗ |
| `DELETE /api/plats/{id}/` | ✓ | ✗ | ✗ | ✗ |
| `GET /api/commandes/` | ✓ | ✓ (ses tables) | ✓ (lecture) | ✓ (les siennes) |
| `POST /api/commandes/` | ✓ | ✓ | ✗ | ✗ |
| `PATCH /api/commandes/{id}/statut/` | ✓ | ✓ | ✓ (plats cuisine) | ✗ |
| `GET /api/employes/` | ✓ | ✗ | ✗ | ✗ |
| `POST /api/employes/` | ✓ | ✗ | ✗ | ✗ |
| `GET /api/stocks/` | ✓ | ✓ (lecture) | ✓ (lecture) | ✗ |
| `POST /api/reservations/` | ✓ | ✓ | ✗ | ✓ |
| `GET /api/dashboard/` | ✓ | ✗ | ✗ | ✗ |
| `GET /api/ia/recommandations/` | ✓ | ✓ | ✗ | ✓ |
| `GET /api/rapports/` | ✓ | ✗ | ✗ | ✗ |

---

### 2.3 Implémentation des Classes de Permission DRF

```python
# apps/core/permissions.py

class IsGerant(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == 'GERANT')

class IsServeurOrGerant(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in ['SERVEUR', 'GERANT'])

# Appliquer sur chaque ViewSet :
class PlatViewSet(ModelViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]  # lecture = tous rôles
        return [IsGerant()]             # écriture = Gérant only
```

---

## 3. Spécifications des Endpoints API

### 3.1 Authentification

| Méthode | Endpoint | Corps | Réponse 200 | Rôle |
|---|---|---|---|---|
| POST | `/api/auth/login/` | `{"username","password"}` | `{"access","refresh"}` | Émet paire JWT |
| POST | `/api/auth/refresh/` | `{"refresh":"<token>"}` | `{"access":"<new>"}` | Rafraîchit access |
| POST | `/api/auth/logout/` | `{"refresh":"<token>"}` | 204 No Content | Blackliste refresh |
| GET | `/api/auth/me/` | — | `{"id","username","role"}` | Profil utilisateur connecté |

---

### 3.2 Module Menu

| Méthode | Endpoint | Description | Permission | Codes HTTP |
|---|---|---|---|---|
| GET | `/api/categories/` | Liste des catégories actives | Authentifié | 200 |
| POST | `/api/categories/` | Créer une catégorie | Gérant | 201 / 400 |
| PATCH | `/api/categories/{id}/` | Modifier nom, ordre, statut | Gérant | 200 / 404 |
| DELETE | `/api/categories/{id}/` | Désactiver (soft delete) | Gérant | 204 |
| GET | `/api/plats/` | Liste (filtre: `categorie_id`, `disponible`) | Authentifié | 200 |
| POST | `/api/plats/` | Créer un plat avec ingrédients | Gérant | 201 / 400 |
| PATCH | `/api/plats/{id}/disponibilite/` | Toggle disponibilité temps réel | Gérant + Cuisinier | 200 |
| GET | `/api/plats/{id}/ingredients/` | Stock utilisé par le plat | Gérant + Cuisinier | 200 |

---

### 3.3 Module Commandes (critique — WebSocket + REST)

| Méthode | Endpoint / Event WS | Description | Permission | Déclencheur |
|---|---|---|---|---|
| POST | `/api/commandes/` | Créer une commande avec lignes | Serveur + Gérant | HTTP REST |
| GET | `/api/commandes/` | Liste commandes actives (filtre: statut, table) | Serveur + Gérant | HTTP REST |
| PATCH | `/api/commandes/{id}/envoyer/` | Envoyer en cuisine + event WS | Serveur + Gérant | REST → WS push |
| PATCH | `/api/commandes/{id}/statut/` | Mise à jour statut global | Gérant | HTTP REST |
| PATCH | `/api/lignes/{id}/statut/` | Cuisinier → `en_preparation` / `pret` | Cuisinier | HTTP REST |
| WS | `ws://host/ws/cuisine/` | Connexion KDS Cuisinier — group `cuisine` | Cuisinier (JWT) | WebSocket |
| WS | `ws://host/ws/salle/` | Connexion Serveur — group `salle` | Serveur (JWT) | WebSocket |
| WS event | `nouvelle_commande` | Push JSON vers groupe cuisine | Système | Via Redis Channel Layer |
| WS event | `plat_pret` | Push vers groupe salle quand plat prêt | Système | Via Redis Channel Layer |
| DELETE | `/api/commandes/{id}/` | Annuler (soft — `statut=annulee`) | Gérant | HTTP REST |

**Format JSON — événement WebSocket `nouvelle_commande` :**

```json
{
  "type": "nouvelle_commande",
  "commande": {
    "id": 42,
    "table_numero": 7,
    "heure": "20:14:32",
    "lignes": [
      {"id": 101, "plat": "Tajine Agneau", "quantite": 2, "notes": "sans piment", "temps_prep": 20},
      {"id": 102, "plat": "Salade Marocaine", "quantite": 1, "notes": "", "temps_prep": 5}
    ],
    "heure_lancement_orchestre": "20:15:00"
  }
}
```

---

### 3.4 Module Stocks

| Méthode | Endpoint | Description | Permission | Codes HTTP |
|---|---|---|---|---|
| GET | `/api/ingredients/` | Liste avec statut stock (OK / ALERTE / RUPTURE) | Gérant + Serveur + Cuisinier | 200 |
| POST | `/api/ingredients/` | Créer ingrédient + seuil alerte | Gérant | 201 / 400 |
| PATCH | `/api/ingredients/{id}/stock/` | Ajuster quantité (entrée livraison) | Gérant | 200 |
| GET | `/api/ingredients/alertes/` | Ingrédients sous le seuil | Gérant | 200 |
| GET | `/api/ia/prediction-stock/` | Prévision consommation J+7 (IA Celery) | Gérant | 200 / 503 si indisponible |

---

### 3.5 Module RH

| Méthode | Endpoint | Description | Permission | Codes HTTP |
|---|---|---|---|---|
| GET | `/api/employes/` | Liste des employés actifs | Gérant | 200 |
| POST | `/api/employes/` | Créer employé + compte utilisateur lié | Gérant | 201 / 400 |
| GET | `/api/employes/{id}/` | Profil détaillé employé | Gérant | 200 / 404 |
| PATCH | `/api/employes/{id}/` | Modifier poste, salaire, date embauche | Gérant | 200 |
| DELETE | `/api/employes/{id}/` | Désactiver compte (`is_active=False`) | Gérant | 204 |

---

### 3.6 Module Réservations

| Méthode | Endpoint | Description | Permission | Codes HTTP |
|---|---|---|---|---|
| GET | `/api/reservations/` | Liste (filtre: date, statut, client_id) | Gérant + Serveur | 200 |
| POST | `/api/reservations/` | Créer réservation (vérifie capacité table) | Authentifié | 201 / 409 conflit |
| PATCH | `/api/reservations/{id}/confirmer/` | Confirmer et assigner table | Gérant + Serveur | 200 |
| PATCH | `/api/reservations/{id}/annuler/` | Annuler — libère table | Authentifié (si propriétaire) | 200 |

---

### 3.7 Module Paiement QR & Split Bill

| Méthode | Endpoint | Description | Permission | Codes HTTP |
|---|---|---|---|---|
| GET | `/api/tables/{id}/qr/` | URL du QR Code permanent de la table | Authentifié | 200 |
| GET | `/api/paiement/{commande_id}/` | Détail addition — lignes à régler | Authentifié | 200 / 404 |
| POST | `/api/paiement/{commande_id}/split-egal/` | Split égal entre N convives | Authentifié | 200 |
| POST | `/api/paiement/{commande_id}/split-individuel/` | Règlement par article `{ligne_id, montant}` | Authentifié | 200 / 400 |
| PATCH | `/api/paiement/{commande_id}/valider/` | Finaliser — `commande.statut = 'payee'` | Serveur + Gérant | 200 |

---

### 3.8 Module IA — Recommandation et Sentiment

| Méthode | Endpoint | Description | Latence max | Codes HTTP |
|---|---|---|---|---|
| GET | `/api/ia/recommandations/?client_id=X` | Top 5 plats — scikit-learn collaborative filtering | < 800 ms | 200 / 204 (pas d'historique) |
| POST | `/api/ia/analyser-avis/` | Analyse sentiment commentaire client (BERT) | < 2 s | 200 / 400 |
| GET | `/api/ia/badge-chef/` | Plats anti-gaspi du jour (IA stock) | < 500 ms | 200 |
| GET | `/api/ia/prediction-stock/` | Prévision J+7 par ingrédient | Async Celery | 202 Accepted |

---

## 4. Modèle de Données — Contraintes d'Implémentation

### 4.1 Règles Globales

- Toutes les tables doivent avoir un champ `id INT PRIMARY KEY AUTO_INCREMENT`.
- Les champs ENUM doivent être implémentés avec `choices=` dans Django et contrainte `CHECK` en SQL.
- Privilégier les soft deletes aux DELETE physiques (`est_actif BOOLEAN` ou `is_active` Django).
- Les timestamps `created_at` et `updated_at` doivent être présents sur toutes les tables transactionnelles (`auto_now_add` / `auto_now`).
- Les clés étrangères doivent avoir `on_delete` explicite : `CASCADE` pour les lignes enfant, `PROTECT` pour les données métier critiques.

---

### 4.2 Schéma des Tables Critiques

#### Table : `utilisateur` (modèle custom Django — AbstractUser)

| Colonne | Type SQL | Contrainte Django | Notes implémentation |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | Hérité AbstractUser |
| `username` | VARCHAR(150) | UNIQUE, NOT NULL | Identifiant de connexion |
| `email` | VARCHAR(254) | UNIQUE, NOT NULL | Utilisé SMTP réservations |
| `role` | ENUM(GERANT, SERVEUR, CUISINIER, CLIENT) | NOT NULL, default=CLIENT | Champ custom sur AbstractUser |
| `is_active` | BOOLEAN | DEFAULT TRUE | Soft delete employés |
| `password` | VARCHAR(128) | Argon2 hashé | Jamais en clair — Argon2 prioritaire |

#### Table : `commande` (table critique — intégrité forte)

| Colonne | Type SQL | `on_delete` Django | Valeurs ENUM |
|---|---|---|---|
| `table_id` | FK → table_restaurant | PROTECT | — |
| `serveur_id` | FK → utilisateur | SET_NULL (nullable) | — |
| `code_promo_id` | FK → code_promo | SET_NULL (nullable) | — |
| `statut` | ENUM | — | `en_cours \| en_cuisine \| prete \| payee \| annulee` |
| `montant_total` | DECIMAL(10,2) | — | Calculé auto — signal `post_save` |

**Signal Django obligatoire — recalcul `montant_total` :**

```python
# apps/core/signals.py
@receiver(post_save, sender=LigneCommande)
def recalcul_total(sender, instance, **kwargs):
    commande = instance.commande
    commande.montant_total = sum(
        l.prix_unitaire * l.quantite
        for l in commande.lignes.filter(statut__ne='annule')
    )
    commande.save(update_fields=['montant_total'])
```

---

### 4.3 Index de Performance Obligatoires

| Table | Colonne(s) indexée(s) | Type | Justification |
|---|---|---|---|
| `commande` | `statut, date_heure` | Composite | Requête filtre tableau de bord |
| `commande` | `table_id` | Btree | Plan de salle — commandes en cours |
| `ligne_commande` | `commande_id, statut_plat` | Composite | KDS — plats par statut |
| `plat` | `est_disponible, categorie_id` | Composite | Menu filtré côté client |
| `reservation` | `date_reservation, statut` | Composite | Agenda réservations |
| `ingredient` | `quantite_stock` | Btree | Alertes stock bas |
| `avis` | `plat_id, est_valide` | Composite | IA recommandation — plats bien notés |

---

## 5. Spécifications Fonctionnelles par Module

### 5.1 Module Back-Office Gérant

#### 5.1.1 Tableau de Bord

Le tableau de bord est la première page chargée après connexion du gérant. Il doit afficher :

- **KPI du jour :** nombre de commandes, chiffre d'affaires, ticket moyen, taux d'occupation tables.
- **Alertes stock :** liste des ingrédients sous le seuil (composant `AlerteBadge` cliquable).
- **Graphique CA 7 jours glissants** (Recharts — LineChart).
- **Liste des réservations du jour** avec statut.
- **Activité en direct :** dernières commandes (polling 30s ou WebSocket optionnel).

> ✅ **Critères d'acceptation**
> - Chargement initial < 1,5 s sur connexion locale.
> - KPI du jour correct à ± 0 MAD par rapport au calcul manuel.
> - Alerte stock visible dans les 30 secondes après passage sous le seuil.
> - Graphique CA affiché correctement même avec 0 commandes (courbe plate à 0).

#### 5.1.2 Gestion Menu

- Création catégorie : nom, description optionnelle, ordre d'affichage, image (upload → `media/`), `est_active`.
- Création plat : nom, catégorie, description, prix (MAD), image, `temps_preparation`, `badge_chef` (toggle).
- Association ingrédients : interface pour lier `plat ↔ ingrédients` avec `quantite_utilisee` par portion.
- Toggle disponibilité temps réel : `PATCH /api/plats/{id}/disponibilite/` — déclenche push WS vers Interface Serveur.
- Le soft-delete d'un plat (`est_disponible=False`) ne doit pas supprimer les `lignes_commande` associées.

#### 5.1.3 Gestion Stocks

- Vue synthétique : tableau ingrédients avec jauge colorée (vert / orange / rouge selon rapport `quantite/seuil`).
- Action "Entrée de stock" : `PATCH /api/ingredients/{id}/stock/` avec `quantite_ajoutee` — traçabilité horodatée.
- Alerte automatique : e-mail Celery envoyé au gérant quand `quantite_stock < seuil_alerte` après décrémentation.
- Décrémentation automatique : signal Django `post_save` sur `LigneCommande.statut → 'servi'` décrémente le stock.

#### 5.1.4 Module RH

- Créer un employé crée simultanément un `Utilisateur` Django et un profil `Employe` lié.
- Le rôle choisi à la création détermine l'interface React accessible au login.
- Désactiver un employé (`is_active=False`) révoque l'accès sans supprimer l'historique des commandes.
- Export PDF de la liste des employés via Celery (tâche async — réponse 202 + polling `/api/taches/{id}/`).

---

### 5.2 Module Kitchen Display System (KDS)

#### 5.2.1 Interface Cuisinier

L'interface KDS est une React SPA qui se connecte en WebSocket dès le chargement. Elle ne doit jamais nécessiter de refresh manuel.

> **Règles de rendu KDS**
> - Chaque commande est une "card" avec : numéro de table, horodatage, liste des plats avec statuts.
> - Couleurs de statut : `en_attente` = gris | `en_preparation` = orange | `pret` = vert.
> - `heure_lancement_orchestre` affiché en rouge si `heure_actuelle > heure_lancement + temps_prep`.
> - Bouton "Marquer Prêt" → `PATCH /api/lignes/{id}/statut/` `{statut: 'pret'}` → push WS `plat_pret` vers salle.
> - Tri : commandes par ancienneté croissante (la plus vieille en haut à gauche).
> - Alerte sonore (beep) à la réception de chaque nouvelle commande (API Web Audio — facultatif mais valorisé).

#### 5.2.2 Orchestrateur de Cuisson

L'orchestrateur calcule `heure_lancement` pour chaque plat afin que tous arrivent simultanément :

```
heure_lancement = heure_commande + (max_temps_prep_commande - temps_prep_plat)
```

- Ce calcul se fait côté backend dans la ViewSet lors du `POST /api/commandes/envoyer/`.
- **Exemple :** plat A (20 min) + plat B (5 min) → A commence immédiatement, B commence dans 15 min.

---

### 5.3 Module Interface Serveur

#### 5.3.1 Plan de Salle Interactif

- Visualisation SVG/Canvas des tables : couleur selon statut (`libre`=vert, `occupée`=rouge, `réservée`=bleu, `encaissement`=ambre).
- Clic sur une table libre → modal "Nouvelle commande" avec sélection des plats.
- Clic sur une table occupée → modal "Commande en cours" avec statut de chaque plat.
- Mise à jour automatique via WebSocket `ws://host/ws/salle/` — aucun refresh manuel.

#### 5.3.2 Prise de Commande

- Sélection des plats par catégorie → ajout de quantité → notes libres par ligne.
- Validation → `POST /api/commandes/` suivi de `PATCH /api/commandes/{id}/envoyer/` (deux appels séquentiels).
- Code promo : champ optionnel avec vérification live `GET /api/codes-promo/valider/?code=XXX`.

#### 5.3.3 Paiement QR

- Bouton "Passer en encaissement" → `table.statut = 'encaissement'` + affichage QR Code de la table.
- Le QR Code est permanent (assigné à la table, pas à la commande) — URL type `/client/table/{id}/paiement/`.
- `PATCH /api/paiement/{id}/valider/` → `commande.statut = 'payee'`, `table.statut = 'libre'`.

---

### 5.4 Module Portail Client

#### 5.4.1 Parcours de Réservation

1. Client sélectionne date + nombre de couverts.
2. `GET /api/tables/?date=X&nb_personnes=N` → liste des tables disponibles.
3. Client sélectionne une table → `POST /api/reservations/`.
4. Email de confirmation envoyé automatiquement via tâche Celery.
5. Client peut annuler tant que `statut = 'en_attente'` (`PATCH /api/reservations/{id}/annuler/`).

#### 5.4.2 Recommandation IA

- **Algorithme :** collaborative filtering (scikit-learn SVD ou NearestNeighbors) basé sur la matrice client × plat.
- **Cold start :** si client a < 3 commandes → retourner top 5 plats les mieux notés (fallback `avis.note`).
- **Réponse API :** `id`, `nom`, `image`, `prix`, `score_confiance` (0.0 à 1.0) pour chaque plat recommandé.
- **Performances :** modèle pré-entraîné chargé en mémoire — pas de re-training à chaque requête (Celery Beat quotidien).

#### 5.4.3 Programme de Fidélité

- Attribution de points : 1 MAD dépensé = 1 point (paramétrable par le gérant).
- Paliers : Bronze (0-499 pts), Argent (500-1999 pts), Or (2000+ pts).
- Avantages par palier affichés sur le portail client + utilisables au moment du paiement.
- Génération de coupon : le gérant peut déclencher manuellement via `POST /api/fidelite/coupon/`.

---

## 6. Spécifications Sécurité

### 6.1 Configuration JWT Obligatoire

| Paramètre simplejwt | Valeur requise | Justification |
|---|---|---|
| `ACCESS_TOKEN_LIFETIME` | `timedelta(minutes=15)` | Fenêtre d'exposition minimale |
| `REFRESH_TOKEN_LIFETIME` | `timedelta(days=7)` | Session semaine |
| `ROTATE_REFRESH_TOKENS` | `True` | Nouveau refresh à chaque rotation |
| `BLACKLIST_AFTER_ROTATION` | `True` | Invalide l'ancien refresh |
| `ALGORITHM` | `HS256` | Standard HMAC-SHA256 |
| `AUTH_HEADER_TYPES` | `('Bearer',)` | RFC 6750 |
| `TOKEN_OBTAIN_SERIALIZER` | Custom — inclure `role` dans payload | RBAC côté frontend |

---

### 6.2 Hashage des Mots de Passe

| Paramètre | Valeur | Notes |
|---|---|---|
| `PASSWORD_HASHERS[0]` | `Argon2PasswordHasher` | Algorithme principal — `pip install django[argon2]` |
| `PASSWORD_HASHERS[1]` | `BCryptSHA256PasswordHasher` | Fallback migration comptes existants |
| Sel | 16 octets aléatoires | Généré automatiquement par Django |
| Facteur coût | `time_cost=2, memory_cost=512, parallelism=2` | Argon2id profile |

---

### 6.3 Variables d'Environnement Sensibles

| Variable | Requis en prod | Jamais versionner | Valeur exemple (dev) |
|---|---|---|---|
| `SECRET_KEY` | Oui | ✓ | `django-insecure-XXXXX` (dev uniquement) |
| `DATABASE_URL` | Oui | ✓ | `mysql://root:pass@localhost/tastify` |
| `REDIS_URL` | Oui | ✓ | `redis://localhost:6379/0` |
| `DEBUG` | Non (`False`) | ✓ | `True` en dev, `False` en prod |
| `ALLOWED_HOSTS` | Oui | ✓ | `localhost,127.0.0.1` |
| `WEATHER_API_KEY` | Oui (IA) | ✓ | Obtenir sur openweathermap.org |
| `HF_MODEL_NAME` | Non | Non | `nlptown/bert-base-multilingual-uncased-sentiment` |
| `EMAIL_HOST` | Oui | ✓ | `smtp.gmail.com` / Mailtrap en dev |

---

### 6.4 En-têtes de Sécurité HTTP Django

```python
# settings.py — Configuration sécurité production

# HTTPS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Headers XSS / Clickjacking
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS — restreindre aux domaines des 4 SPAs React
CORS_ALLOWED_ORIGINS = [
    'https://gerant.tastify.ma',
    'https://salle.tastify.ma',
    'https://cuisine.tastify.ma',
    'https://client.tastify.ma',
]
CORS_ALLOW_CREDENTIALS = True  # Nécessaire pour cookies HttpOnly refresh
```

---

## 7. Architecture de Déploiement Docker

### 7.1 Services Docker Compose

| Service | Image | Ports | Dépend de | Rôle |
|---|---|---|---|---|
| `nginx` | nginx:alpine | 80, 443 → public | web, daphne | Reverse proxy + sert builds React |
| `web` | python:3.11-slim | 8000 (interne) | mysql, redis | Gunicorn — API REST DRF |
| `daphne` | python:3.11-slim | 9001 (interne) | redis | ASGI WebSocket Django Channels |
| `mysql` | mysql:8.0 | 3306 (interne) | — | Base de données principale |
| `redis` | redis:7-alpine | 6379 (interne) | — | Broker Celery + Channel Layer |
| `celery-worker` | python:3.11-slim | — | mysql, redis | Tâches async : e-mails, PDF, IA |
| `celery-beat` | python:3.11-slim | — | redis | Cron quotidien : prédictions |

---

### 7.2 Configuration Nginx Obligatoire

```nginx
server {
  listen 80;
  server_name tastify.ma;

  # Servir les builds React statiques
  location / {
    root /usr/share/nginx/html/client;
    try_files $uri /index.html;  # SPA fallback — CRITIQUE pour React Router
  }

  # Proxifier l'API REST vers Gunicorn
  location /api/ {
    proxy_pass http://web:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  # Proxifier WebSocket vers Daphne — CRITIQUE : upgrade headers obligatoires
  location /ws/ {
    proxy_pass http://daphne:9001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
  }
}
```

---

### 7.3 Stratégie de Sauvegarde

| Composant | Fréquence | Méthode | Destination | Rétention |
|---|---|---|---|---|
| Base MySQL | Quotidienne 02h00 | `mysqldump` via Celery Beat | Volume Docker / S3 | 30 jours |
| Fichiers media | Quotidienne 02h30 | rsync / S3 sync | S3 compatible (ex: Wasabi) | 90 jours |
| Logs applicatifs | Rotation hebdo | logrotate Django | Fichier local | 7 jours |
| Redis (Celery jobs) | Non requis | Reconstituable | — | — |

---

## 8. Stratégie de Tests

### 8.1 Structure des Tests

| Type | Outil | Cible | Couverture min. |
|---|---|---|---|
| Tests unitaires models | pytest-django | Signaux, méthodes, calculs | 90% |
| Tests API (ViewSets) | pytest + APIClient DRF | Chaque endpoint + RBAC | 100% endpoints |
| Tests permissions | pytest | Chaque rôle sur chaque endpoint sensible | 100% combinaisons |
| Tests WebSocket | `channels.testing.WebsocketCommunicator` | Réception événements KDS | Scénario nominal |
| Tests IA | pytest | Reco avec historique connu, cold start | Sortie format valide |
| Tests de charge | Locust | 50 users concurrents, service complet | Temps réponse < 300ms P95 |

---

### 8.2 Cas de Tests Critiques — RBAC

| Scénario | Acteur | Endpoint | Résultat attendu |
|---|---|---|---|
| Cuisinier tente de créer un plat | Cuisinier | `POST /api/plats/` | 403 Forbidden |
| Client accède aux employés | Client | `GET /api/employes/` | 403 Forbidden |
| Serveur tente d'accéder au dashboard | Serveur | `GET /api/dashboard/` | 403 Forbidden |
| Requête sans token JWT | Anonyme | `GET /api/commandes/` | 401 Unauthorized |
| Token expiré (access > 15 min) | N'importe lequel | `GET /api/plats/` | 401 — forcer refresh |
| Serveur accède à une commande d'une autre table | Serveur | `GET /api/commandes/{autre_id}/` | 403 ou 404 |

---

## 9. Standards de Développement

### 9.1 Conventions Backend Django

- **Nommage :** `snake_case` pour variables/fonctions Python. Classes en `PascalCase`.
- Chaque ViewSet doit avoir une docstring décrivant : rôles autorisés, méthodes exposées, comportements spéciaux.
- Pas de logique métier dans les views — la logique va dans les `models`, `services/` ou `managers`.
- Utiliser `select_related()` et `prefetch_related()` systématiquement pour éviter les requêtes N+1.
- Migrations : une migration = une modification atomique. Jamais de squash en développement actif.
- Serializers : validation dans `validate()` du serializer, pas dans la view.
- Fichier `.env.example` maintenu à jour avec toutes les variables (sans valeurs sensibles).

---

### 9.2 Conventions Frontend React

- Composants en `PascalCase`, fichiers en `kebab-case`. Exemple : `CommandeCard.jsx`.
- Hooks custom préfixés `use` : `useWebSocket`, `useCommande`, `useAuth`.
- Pas de `fetch()` directement dans les composants — utiliser des hooks ou un service `api.js` centralisé.
- Tailwind uniquement — pas de CSS inline ni de fichiers `.css` customs sauf pour les animations keyframe.
- Palette ECO-FRESH dans `tailwind.config.js` : `dark:#264653`, `teal:#2A9D8F`, `amber:#E9C46A`.
- Gestion d'erreur : chaque appel API enveloppe les erreurs et affiche un toast utilisateur.

---

### 9.3 Git & Workflow

| Branche | Utilisation | Merge vers | Protection |
|---|---|---|---|
| `main` | Production stable | — | PR obligatoire + 1 review |
| `develop` | Intégration continue | `main` (release) | PR obligatoire |
| `feature/XXX` | Développement fonctionnalité | `develop` | Merge direct autorisé |
| `fix/XXX` | Correction de bug | `develop` | Merge direct autorisé |
| `release/vX.Y.Z` | Préparation release | `main` + `develop` | PR obligatoire |

**Format des commits :** `<type>(<scope>): <description>`

Types autorisés : `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore`

Exemple : `feat(kds): ajouter push websocket plat_pret vers salle`

---

## 10. Livrables et Critères de Réception

### 10.1 Livrables Attendus

| Livrable | Format | Délai | Responsable |
|---|---|---|---|
| Dépôt Git structuré (monorepo) | GitHub/GitLab | Continu | Équipe |
| `docker-compose.yml` fonctionnel | YAML | Sprint 1 | Ingénieur DevOps |
| Migrations Django complètes | `.py` migrations | Sprint 1 | Ingénieur Backend |
| API DRF avec documentation Swagger | drf-spectacular | Sprint 2 | Ingénieur Backend |
| 4 applications React fonctionnelles | Build Vite | Sprint 3 | Ingénieur Frontend |
| Suite de tests pytest (≥ 80% coverage) | pytest + coverage.py | Sprint 3 | Équipe |
| Rapport de tests de charge Locust | HTML export | Sprint 4 | Ingénieur QA |
| Documentation API Postman/Swagger | JSON collection | Sprint 4 | Ingénieur Backend |

---

### 10.2 Definition of Done

> ✅ **Une feature est considérée DONE si et seulement si :**
> - Code reviewé et approuvé par au moins 1 autre ingénieur.
> - Tests unitaires écrits et passants (couverture ≥ 80% du module).
> - Tests RBAC écrits pour tous les rôles concernés par la feature.
> - Endpoint documenté dans Swagger (`@extend_schema` drf-spectacular).
> - Pas de `print()` ni de `TODO` non commenté dans le code mergé.
> - Migration Django générée et testée sur base vierge.
> - Build Docker Compose fonctionnel après merge.

---

### 10.3 Jalons du Projet

| Sprint | Durée | Objectifs | Livrable |
|---|---|---|---|
| Sprint 0 | 1 semaine | Setup environnement — Docker, MySQL, Redis, structure Django | `docker-compose up` fonctionnel |
| Sprint 1 | 2 semaines | Modèles Django, migrations, JWT, permissions RBAC, endpoints Auth + Menu | API auth + menu testable Postman |
| Sprint 2 | 2 semaines | Commandes REST + WebSocket KDS, stocks, RH, réservations | KDS fonctionnel en local |
| Sprint 3 | 2 semaines | 4 interfaces React — Back-Office, Salle, KDS, Portail Client | Parcours complet serveur → cuisine |
| Sprint 4 | 2 semaines | IA recommandation + sentiment, fidélité, QR paiement, PWA | Portail client complet |
| Sprint 5 | 1 semaine | Tests de charge, optimisations, documentation, déploiement VPS | Livraison finale — production |

---

## Annexe A — Environnement de Développement Local

### A.1 Prérequis

- Python 3.11+ (recommandé : pyenv)
- Node.js 20 LTS + npm 10+
- Docker Desktop 4.x + Docker Compose 2.x
- Git 2.40+
- VS Code avec extensions : Pylance, ESLint, Tailwind CSS IntelliSense, Docker

### A.2 Démarrage Rapide

```bash
# 1. Cloner le dépôt
git clone https://github.com/emsi-innovation/tastify.git && cd tastify

# 2. Copier et configurer les variables d'environnement
cp .env.example .env  # Éditer DATABASE_URL, REDIS_URL, EMAIL_HOST

# 3. Lancer l'infrastructure Docker
docker-compose up -d mysql redis

# 4. Installer les dépendances Python
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 5. Initialiser la base de données
python manage.py migrate
python manage.py createsuperuser       # Compte gérant initial
python manage.py loaddata fixtures/demo_data.json  # Données de démo

# 6. Lancer le serveur de développement
python manage.py runserver             # API sur :8000
daphne -p 9001 tastify.asgi:application  # WebSocket (terminal séparé)

# 7. Frontend (exemple pour le back-office gérant)
cd frontend/gerant && npm install && npm run dev  # React sur :5173
```

---

## Annexe B — Glossaire Technique

| Terme | Définition |
|---|---|
| RBAC | Role-Based Access Control — contrôle d'accès par rôles métier (Gérant, Serveur, Cuisinier, Client) |
| KDS | Kitchen Display System — écran temps réel en cuisine affichant les commandes à préparer |
| JWT | JSON Web Token — standard d'authentification stateless (access + refresh tokens) |
| Channel Layer | Couche d'abstraction Django Channels utilisant Redis pour router les messages WebSocket entre process |
| Orchestrateur KDS | Module calculant `heure_lancement` de chaque plat pour synchroniser la sortie simultanée des tables |
| Split Bill | Fonctionnalité de partage de l'addition — répartition égale ou par article consommé |
| PWA | Progressive Web App — application web installable avec mode hors-ligne via Service Worker |
| Celery Beat | Scheduler Celery — équivalent de cron pour les tâches asynchrones récurrentes |
| Cold Start | Situation d'un nouvel utilisateur sans historique — nécessite une stratégie de recommandation par défaut |
| ECO-FRESH | Palette de couleurs du projet : `#264653` (ardoise), `#2A9D8F` (teal), `#E9C46A` (ambre), `#F4A261` (orange) |

---

*TASTIFY © 2026 — EMSI Innovation — Diouri Mehdi & El Kharrazi Ibtihal*  
*Document à usage interne — toute reproduction est soumise à l'accord des auteurs.*