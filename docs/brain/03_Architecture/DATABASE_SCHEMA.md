# Relational Database Schema (MySQL 8.0)

## 1. Module: Utilisateurs
- **Utilisateur** (`AbstractUser`):
  - `role`: `Enum(GERANT, SERVEUR, CUISINIER, CLIENT)`
  - `telephone`: `String`

## 2. Module: Menu (menu)
- **Categorie**:
  - `nom`: `String`
  - `image`: `ImageField`
  - `est_active`: `Boolean` (Soft Delete)
- **Plat**:
  - `categorie`: `FK(Categorie)`
  - `nom`: `String`
  - `prix`: `Decimal`
  - `temps_preparation`: `Integer` (Minutes)
  - `image`: `ImageField`
  - `est_disponible`: `Boolean` (Toggle temporaire)
  - `est_active`: `Boolean` (Soft Delete)

## 3. Module: Tables (tables)
- **Table**:
  - `numero`: `Integer` (Unique)
  - `capacite`: `Integer`
  - `statut`: `Enum(LIBRE, OCCUPEE, RESERVEE)`
  - `pos_x`, `pos_y`: `Float` (Coordonnées pour le plan)
  - `est_active`: `Boolean` (Soft Delete)

## 4. Module: Commandes (commandes)
- **Commande**:
  - `table`: `FK(Table)`
  - `serveur`: `FK(Utilisateur)`
  - `statut`: `Enum(EN_COURS, PRETE, PAYEE, ANNULEE)`
  - `montant_total`: `Decimal`
  - `est_active`: `Boolean`
- **CommandeLigne**:
  - `commande`: `FK(Commande)`
  - `plat`: `FK(Plat)`
  - `quantite`: `Integer`
  - `prix_unitaire`: `Decimal` (Snapshot au moment de la commande)
  - `statut`: `Enum(EN_ATTENTE, EN_PREPARATION, PRET, SERVI)`
  - `heure_lancement`: `DateTime` (Calculé par l'orchestrateur)
  - `heure_fin_estimee`: `DateTime`
  - `celery_task_id`: `String` (Pour révocation)

## 5. Module: Stocks (Planifié)
- **Ingredient**: `nom`, `quantite`, `seuil_alerte`, `unite`.
- **CompositionPlat**: `plat`, `ingredient`, `quantite_requise`.
