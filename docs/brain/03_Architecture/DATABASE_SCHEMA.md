# Database Schema & Constraints

Based on the [Cahier de Charges](../../cahier_de_charge_tastify.md), here are the critical rules and structure for the MySQL database.

## 1. Global Rules
- **Primary Keys**: All tables must have an `id INT PRIMARY KEY AUTO_INCREMENT`.
- **ENUMs**: Implemented with `choices=` in Django and `CHECK` constraint in SQL.
- **Soft Deletes**: Use `est_actif BOOLEAN` or `is_active` instead of physical `DELETE`.
- **Timestamps**: `created_at` and `updated_at` (`auto_now_add` / `auto_now`) on all transactional tables.
- **Foreign Keys**: `on_delete` must be explicit: `CASCADE` for child rows, `PROTECT` for critical business data.

## 2. Core Tables

### `utilisateur` (AbstractUser)
| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT |
| `username` | VARCHAR(150) | UNIQUE, NOT NULL |
| `email` | VARCHAR(254) | UNIQUE, NOT NULL |
| `role` | ENUM | GERANT, SERVEUR, CUISINIER, CLIENT |
| `is_active` | BOOLEAN | DEFAULT TRUE |
| `password` | VARCHAR(128) | Argon2 hash |

### `commande`
| Column | Type | `on_delete` | Notes |
|---|---|---|---|
| `table_id` | FK | PROTECT | To `table_restaurant` |
| `serveur_id` | FK | SET_NULL | To `utilisateur` |
| `code_promo_id` | FK | SET_NULL | To `code_promo` |
| `statut` | ENUM | - | `en_cours | en_cuisine | prete | payee | annulee` |
| `montant_total` | DECIMAL | - | Auto-calculated via `post_save` |

### `ligne_commande`
| Column | Type | Notes |
|---|---|---|
| `commande_id` | FK | `CASCADE` |
| `plat_id` | FK | `PROTECT` |
| `quantite` | INT | |
| `prix_unitaire` | DECIMAL | Copied from `plat.prix` at creation |
| `statut` | ENUM | `en_attente | en_preparation | pret | servi | annule` |
| `notes` | TEXT | E.g. "sans piment" |

## 3. Required Django Signals
The `montant_total` must be updated automatically:
```python
@receiver(post_save, sender=LigneCommande)
def recalcul_total(sender, instance, **kwargs):
    commande = instance.commande
    commande.montant_total = sum(
        l.prix_unitaire * l.quantite
        for l in commande.lignes.filter(statut__ne='annule')
    )
    commande.save(update_fields=['montant_total'])
```

## 4. Required Indexes
| Table | Columns | Justification |
|---|---|---|
| `commande` | `statut, date_heure` | Dashboard filters |
| `commande` | `table_id` | Live floor plan |
| `ligne_commande` | `commande_id, statut_plat` | KDS queries |
| `plat` | `est_disponible, categorie_id` | Filtered menu |
| `reservation` | `date_reservation, statut` | Reservations agenda |
| `ingredient` | `quantite_stock` | Low stock alerts |
| `avis` | `plat_id, est_valide` | AI recommendations |
