# RÉFÉRENTIEL TECHNIQUE ET FONCTIONNEL : TASTIFY (RAPPORT PFA)
*Ce document constitue la source de vérité pour la rédaction du rapport de Projet de Fin d'Études.*
*Dernière mise à jour : 1er Juin 2026*

---

## 1. VISION ET IDENTITÉ VISUELLE

Tastify est un "Ecosystème de Commandement" pour la restauration haut de gamme, fusionnant une interface client luxueuse et organique avec un centre d'opérations tactique ultra-efficace.

### **Mandat "Absolute Visibility" & "Zero Transparency"**
*   **Philosophie :** L'information fonctionnelle (Login, KDS, Dashboard) doit être lisible instantanément sans aucune ambiguïté.
*   **Zéro Transparence :** Interdiction stricte des calques semi-transparents, des flous de fond (backdrop blur) et des couleurs de texte à faible opacité (opacity < 60%) pour le contenu critique.
*   **Contraste Élevé :** Utilisation systématique de graisses de police "Extra Bold" et de couleurs à fort contraste (ex: `#301400` sur fond clair ou blanc pur sur fond sombre) pour les données d'exploitation.

### **Charte Graphique : Portail Client ("Warm Organic Sophistication")**
*   **Axe Créatif :** Chaleureux, haut de gamme, minimaliste et appétissant.
*   **Palette de Couleurs :**
    *   **Crème (#FAF9F6) :** Fond principal, apporte luminosité et propreté.
    *   **Terre de Sienne (#D14D1A) :** Couleur d'accentuation pour les actions fortes et le luxe.
    *   **Or Doux (#C5A059) :** Pour les badges de fidélité et les indicateurs premium.
    *   **Brun Café (#2D2424) :** Pour le texte et les contrastes de structure.
*   **Typographie :**
    *   **Cormorant (Serif) :** Titres élégants, souvent en italique, pour un effet éditorial.
    *   **Montserrat (Sans) :** Corps de texte et étiquettes techniques pour une lisibilité parfaite.
*   **Effets :** Micro-animations fluides (Framer Motion), textures de bruit subtiles (SVG noise), et dégradés de lueur (glow).

### **Charte Graphique : Backoffice ("Intelligent Restaurant OS")**
*   **Axe Créatif :** Minimalisme de luxe, précision chirurgicale, "Invisible Hand" (gestion discrète et efficace).
*   **Palette de Couleurs :**
    *   **Canevas Pur (#FFFFFF / #FCF9F8) :** Fond blanc cassé pour une clarté maximale et un sentiment de propreté.
    *   **Bleu Cobalt (#0040E0) :** Utilisé exclusivement pour les appels à l'action primaires et les états critiques.
    *   **Charbon Profond (#1C1B1B) :** Pour la typographie principale, offrant un contraste doux et sophistiqué.
    *   **Lignes de Structure (#E5E5E5) :** Hairlines ultra-fines de 0.5px pour définir les zones sans encombrement visuel.
*   **Typographie :**
    *   **Inter (Standard UI) :** Utilisée pour l'ensemble de l'interface pour garantir une lisibilité maximale et un aspect professionnel neutre ("Normal font").
    *   **JetBrains Mono :** Exclusivement pour les données chiffrées et chronomètres.
*   **Concepts Clés :** "Double-Bezel" (doubles bordures pour la profondeur), Glassmorphism (effets de verre pour les modales), et Espacement Généreux (breathing room).

---

## 2. ARCHITECTURE TECHNIQUE

L'application repose sur une stack moderne, conteneurisée et prête pour le temps réel.

*   **Backend :** Django 5.x avec Django REST Framework (API) et Django Channels (WebSockets).
*   **Frontend :** Deux applications React distinctes bâties avec Vite 8.x et Tailwind CSS 4.0.
*   **Temps Réel :** Flux bidirectionnel via WebSockets pour le KDS et les notifications serveur.
*   **Gestion des Tâches :** Celery + Redis pour l'orchestration Juste-à-Temps de la cuisine.
*   **Base de Données :** MySQL 8.0 pour la persistence des données transactionnelles.
*   **Déploiement :** Entièrement orchestré via Docker-Compose (8 services au total).

---

## 3. PARCOURS UTILISATEURS (USER JOURNEYS)

### **A. Le Parcours de Commande (Order Journey)**
1.  **Saisie (Staff OS) :** Le serveur prend la commande sur une interface tactile (Plan de salle).
2.  **Validation :** La commande passe au statut `EN_CUISINE`.
3.  **Orchestration IA :** L'orchestrateur KDS calcule les temps de préparation pour que tous les plats d'une table soient prêts simultanément.
4.  **Préparation (KDS) :** Le cuisinier voit les tickets. Il marque les plats comme `PRÊT`.
5.  **Service :** Une fois tous les plats terminés, le ticket passe en `PRÊT AU SERVICE`. Le serveur reçoit une notification audio et visuelle sur son terminal.
6.  **Encaissement Hybride :** Le personnel dispose d'un module de paiement tactique permettant de choisir entre un règlement physique immédiat (Espèces, Carte/TPE) ou la génération d'un **QR Code Dynamique** permettant au client de régler en autonomie sur son smartphone via son Hub Membre.

### **B. Le Parcours de Fidélité & Points**
1.  **Identité :** Le client s'inscrit sur le portail client (Identité Invité Vérifiée).
2.  **Transaction :** Après avoir mangé, le client règle sa note (ex: via QR Code).
3.  **Attribution Automatique :** Le système détecte le règlement et attribue **1 point pour chaque 10 DH/EUR** dépensés.
4.  **Progression :** Les points s'accumulent dans le "Hub Membre". Le système calcule automatiquement le grade (BRONZE -> ARGENT -> OR -> PLATINE).
5.  **Récompenses :** Le client débloque des privilèges exclusifs (ex: Apéritif offert) directement utilisables lors de la prochaine visite.

### **C. Le Système d'Avis (Feedback Loop)**
1.  **Vérification de l'Expérience :** Seuls les clients ayant un historique de commande payée peuvent poster un avis.
2.  **Partage Simple :** Champ de texte pur (pas d'étoiles) pour favoriser l'expression naturelle.
3.  **Analyse IA (Sentiment Analysis) :** Le backend analyse le texte via un modèle de NLP (IA) pour générer un score de sentiment.
4.  **Recommandation Dynamique :** Les plats avec les meilleurs scores de sentiment montent dans le classement "Top Tendances" de la page d'accueil, quelle que soit leur catégorie.

---

## 4. MODULES FONCTIONNELS PRINCIPAUX

### **Portail Client**
*   **Landing Page :** Présentation immersive de l'établissement et des signatures du moment.
*   **Menu Digital :** Vitrine consultable des créations culinaires.
*   **Réservation Gérée :** Système de réservation intelligent (nécessite un compte).
*   **Hub Membre :** Centralisation du profil, historique des commandes, réservations actives et privilèges de fidélité.

### Backoffice (Tastify OS)
*   **Tableau de Bord :** Analytics en temps réel sur les ventes, les couverts et les KPI.
*   **Plan de Salle :** Gestion visuelle des tables (drag & drop) et occupation en direct. Optimisation des interactions (Single-Tap) et robustesse des sélecteurs pour la fiabilité opérationnelle.
*   **Système KDS :** Écran de cuisine optimisé pour la lecture rapide, chronométré et réactif.
*   **Gestion des Ressources Humaines (RH) :** Registre du personnel, rôles et contacts opérationnels.
*   **Gestion de l'Inventaire :** Suivi des stocks avec système de réapprovisionnement rapide et alertes de rupture critique.
*   **Paramètres Système :** Configuration globale (nom, adresse, horaires, devise) synchronisée en temps réel avec le front-end client.
*   **Absolute Contrast Overhaul :** Refonte complète de la typographie fonctionnelle pour éliminer les opacités réduites et garantir une lisibilité maximale (Zero Transparency).

---

## 5. RÈGLES MÉTIERS SPÉCIFIQUES (BUSINESS RULES)
*   **Gating Sécuritaire :** La page d'accueil et le menu sont publics. La réservation et la fidélité sont privées.
*   **Service Collaboratif :** Pour garantir une fluidité totale en période de rush, tout membre du personnel authentifié (Serveur, Gérant) a désormais l'autorité technique et l'accès visuel (QuerySet) pour consulter et modifier n'importe quelle commande active ou d'encaisser un règlement, rompant avec le modèle de propriété individuelle strict pour privilégier l'efficacité collective.
*   **Absence de Panier :** Tastify se concentre sur l'expérience en salle. Pas de vente à emporter directe ou livraison via l'app client.
*   **Avis Vérifiés :** Seuls les clients ayant un historique de commande payée peuvent publier un retour d'expérience.
*   **Priorité d'Affichage :** Les recommandations IA sont transversales (cross-category).
*   **Alertes Tactiques :** Notifications audios et visuelles (toasts) pour les événements critiques en salle et cuisine.
