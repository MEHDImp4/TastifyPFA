# Module: Interface Serveur (Salle)

Ce module est utilisé par les serveurs sur tablette ou mobile pour gérer le service en salle. Accessible via le portail Staff (Port 3000).

## 1. Plan de Table Temps Réel (Implémenté)
- **Visualisation SVG** : Représentation graphique de la salle.
- **Statuts Dynamiques** : 
  - **Vert** : Libre.
  - **Rouge** : Occupée (Commande en cours).
  - **Bleu** : Réservée (Planifié).
- **Navigation** : Sélection d'une table pour ouvrir l'interface de prise de commande.

## 2. Prise de Commande (Implémenté)
- **Menu Tactile** : Navigation par catégories (onglets).
- **Panier Isolé** : Chaque table a son propre panier persistant localement.
- **Notes** : Possibilité d'ajouter des notes spécifiques par plat (ex: "Sans oignon").
- **Soumission** : Création atomique de la commande et des lignes via l'API.

## 3. Orchestration & KDS (Implémenté)
- Une fois validée, la commande est envoyée au backend pour orchestration.
- Le serveur peut voir l'état d'avancement des plats (En attente, En préparation, Prêt).

## 4. Paiements & Encaissement (Planifié)
- **Split Bill** : Division de la note (égale ou par article).
- **QR Code** : Génération d'un code de paiement pour le client.
- **Clôture** : Libération automatique de la table après paiement.
