# RÉFÉRENTIEL TECHNIQUE ET FONCTIONNEL : TASTIFY (RAPPORT PFA)
*Ce document constitue la source de vérité pour la rédaction du rapport de Projet de Fin d'Études.*
*Dernière mise à jour : 1er Juin 2026*

---

## 1. VISION ET IDENTITÉ VISUELLE

Tastify a évolué vers une esthétique **"Ultra-Minimaliste"** (Atelier Numérique), privilégiant la clarté brute, l'efficacité opérationnelle et une sobriété haut de gamme. L'interface abandonne les artifices visuels pour se concentrer sur l'essentiel : la donnée et l'action.

### **Philosophie : "Pure Utility & Quiet Sophistication"**
*   **Minimalisme Radical :** Suppression des ombres portées, des dégradés complexes et des effets de transparence. Profondeur créée uniquement par des bordures fines (1px) et des contrastes de tons.
*   **Zéro Italique :** Suppression systématique des polices en italique pour un aspect plus "plat", technique et moderne.
*   **Fluidité Statique :** Retrait des animations de transition lourdes au profit d'un ressenti instantané et utilitaire.

### **Charte Graphique Unifiée ("Bone & Charcoal")**
*   **Palette de Couleurs :**
    *   **Canvas Bone (#FBFBFA) :** Fond principal cassé, offrant une neutralité reposante.
    *   **Pure Surface (#FFFFFF) :** Pour les cartes et conteneurs, délimités par des bordures.
    *   **Ink Charcoal (#111111) :** Couleur unique pour le texte principal et les actions (boutons).
    *   **Zinc Muted (#71717A) :** Pour les métadonnées et le contenu secondaire.
    *   **Atelier Border (#EAEAEA) :** Bordures de structure uniformes.
*   **Typographie (Pure Sans-Serif) :**
    *   **Public Sans / Geist Sans :** Stack unique pour tout le projet. Une police géométrique, neutre et hautement lisible.
    *   **JetBrains Mono :** Utilisée pour les prix, IDs techniques et chronomètres.
*   **Composants :** "Atelier Cards" à bordures fines, boutons à angles droits (4px-8px) et icônes à trait ultra-fin (1px).

---

## 2. ARCHITECTURE TECHNIQUE

L'application repose sur une stack moderne, conteneurisée et robuste, validée par une pipeline de tests automatisés.

*   **Backend :** Django 5.x avec Django REST Framework (API) et Django Channels (WebSockets).
*   **Frontend :** Deux applications React (Client & Backoffice) bâties avec Vite 8.x et Tailwind CSS 4.0.
*   **Qualité & CI/CD :** 
    *   Linting ESLint et Typechecking TypeScript systématiques.
    *   Tests Unitaires via Vitest.
    *   Tests E2E (End-to-End) via Playwright couvrant les parcours critiques.
    *   Pipeline GitHub Actions avec exécution containerisée (Docker).

---

## 3. RÈGLES MÉTIERS ET INTÉGRITÉ DES DONNÉES

### **A. Intégrité Financière (Module Paiements)**
*   **Contrainte de Montant :** Validation au niveau du modèle et de la base de données (CheckConstraint) interdisant tout paiement inférieur ou égal à zéro.
*   **Validation "Full Clean" :** Utilisation de la validation forcée de Django pour garantir l'intégrité avant chaque écriture en base.

### **B. Persistance Logistique (Module Stock)**
*   **Soft-Delete :** Les ingrédients ne sont jamais supprimés physiquement. Un champ `est_active` gère la visibilité, permettant de conserver l'historique des mouvements de stock et des recettes passées.
*   **Alertes de Rupture :** Notification automatique dès que le seuil critique est atteint, intégrée au Centre de Notifications.

### **C. Service Collaboratif (Modèle de Gestion)**
*   **Efficacité Collective :** Tout membre du personnel (Serveur, Gérant) peut consulter, modifier ou encaisser n'importe quelle commande active. Ce modèle rompt avec la propriété individuelle pour maximiser la fluidité en période de forte affluence.

### **D. Localisation Linguistique Rigide (Français Unique)**
*   **Verrouillage de la Langue :** L'interface utilisateur du Backoffice et du personnel (Staff) est strictement verrouillée en français. Toutes les chaînes de texte, boutons, indicateurs d'état (ex: En Ligne, Dégradé, Actif, Unités Actives), messages système et informations de support technique sont affichés exclusivement en français pour garantir l'uniformité linguistique et opérationnelle.

---

## 4. PARCOURS UTILISATEURS PRINCIPAUX

### **A. Le Parcours de Commande (Order Journey)**
1.  **Saisie :** Interface de plan de salle centrée et épurée.
2.  **Préparation :** Orchestration KDS chronométrée.
3.  **Encaissement :** Module hybride (Physique ou QR Code dynamique pour paiement autonome client).

### **B. Le Système d'Avis IA (Feedback Loop)**
1.  **Vérification :** Avis réservés aux clients ayant réglé une commande.
2.  **Analyse IA :** Score de sentiment généré par un modèle NLP pour chaque retour textuel.
3.  **Promotion Dynamique :** Les plats les mieux notés montent automatiquement en "Top Tendances" sur l'accueil.

---

## 5. MODULES FONCTIONNELS

*   **Portail Client :** Landing page, Menu Digital, Réservation intelligente (sans animations, focus vitesse), et Hub Membre.
*   **Backoffice (Tastify OS) :** 
    *   **Tableau de Bord :** Analytics temps réel (Revenu, Occupation, Service).
    *   **Plan de Salle :** Gestion visuelle des tables (occupée/libre/addition).
    *   **Système KDS :** Écran de cuisine haute performance.
    *   **Gestion RH :** Registre du personnel et accès.
    *   **Centre de Notifications :** Alertes opérationnelles et logistiques centralisées.
