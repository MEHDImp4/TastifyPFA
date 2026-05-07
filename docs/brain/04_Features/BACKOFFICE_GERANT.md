# Module: Back-Office Gérant

Ce module centralise la gestion administrative du restaurant. Il est accessible uniquement au rôle `GERANT` via le portail Staff (Port 3000).

## 1. Gestion du Menu (Implémenté)
- **Catégories** : Création, modification, suppression logique (`est_active`), et gestion des images.
- **Plats** : Gestion complète des plats avec prix, temps de préparation, et liaison aux catégories.
- **Soft Delete** : Les catégories et plats supprimés sont conservés en base avec `est_active=False` pour préserver l'historique des commandes.

## 2. Gestion de la Salle (Implémenté)
- **Plan de Table Interactif** : Éditeur de plan de table intégré.
- **Positionnement** : Drag & drop des tables avec magnétisme (grille de 20px) et détection de collision.
- **Capacité** : Gestion du nombre de places par table.

## 3. Dashboard & Analytics (En cours / Planifié)
- **KPIs** : Commandes du jour, Chiffre d'Affaires (CA), Panier moyen.
- **Graphiques** : Visualisation des ventes sur 7 jours via Recharts.

## 4. Stocks & Inventaire (Planifié)
- **Alertes** : Seuils de stock critique.
- **Déduction Automatique** : Les stocks diminuent automatiquement lors de la validation des plats en cuisine.

## 5. RH (Planifié)
- **Employés** : Gestion des profils et des accès.
