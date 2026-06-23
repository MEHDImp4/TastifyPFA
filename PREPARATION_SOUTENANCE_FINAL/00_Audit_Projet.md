# Audit projet Tastify avant soutenance

## Fichiers analysés

- Présentation finale : `docs/Presentation Tastify final.pptx` ; extraction du contenu des 21 slides, version modifiée le 23 juin 2026 à 00:23.
- Rapport final : `docs/rapport-pfa-tastify-final/main.tex` et chapitres `00_frontmatter.tex` à `08_annexes.tex`.
- Documents de préparation : `docs/pfa-demo-runbook.md`, `docs/pfa-jury-qa.md`, `docs/pfa-test-readiness.md`.
- Vidéo de démonstration : `docs/demo-videos/tastify-demo-presentation.mp4` et sous-titres associés.
- Code backend : `app/backend/apps/*`, `app/backend/tastify_backend/*`, `app/backend/requirements.txt`.
- Code frontend : `app/frontend/backoffice-app/*`, `app/frontend/client-app/*`.
- Déploiement local : `docker-compose.yml`, `start-demo-local.bat`, `run-pfa-readiness.bat`.

## Faits techniques confirmés

- Sujet : digitalisation des services de restauration avec gestion des commandes, réservations et analyse de sentiment.
- Étudiants : Diouri Mehdi et El Kharrazi Ibtihal.
- Encadrante : Mme Bensaleh Nouhaila.
- Jury mentionné dans la présentation : M. Sraidi Khalid.
- Architecture : backend Django REST Framework, base MySQL, Redis, Celery, Django Channels, deux frontends React.
- Back-office staff : port local `3000`.
- Portail client : port local `3003`.
- Backend ASGI : Daphne sur le port `8000`.
- Services Docker Compose : `db`, `redis`, `backend`, `celery-worker`, `celery-beat`, `backoffice-app`, `client-app`.
- Modules backend confirmés : utilisateurs, menu, tables, commandes, stock, RH, réservations, paiements, avis, analytics, fidélité, configuration.
- Rôles confirmés : gérant, serveur, cuisinier, client.
- Authentification : JWT avec `djangorestframework-simplejwt`, séparation staff/client et permissions DRF.
- Temps réel : WebSocket via Django Channels et Redis pour les événements staff et KDS.
- Analyse de sentiment : tâche Celery `apps.avis.tasks.analyze_review_sentiment`.
- Modèles de sentiment : `nlptown/bert-base-multilingual-uncased-sentiment`, `moussaKam/MARBERT-sentiment`, fallback `fallback-lexique-multilingue`.
- Paiement QR : token signé temporaire lié à une table et une commande ; paiement simulé, pas bancaire.
- Tests indiqués dans le rapport : 346 tests backend passés, 93 % de couverture, 25 tests Vitest back-office, 4 tests Vitest client, 121 scénarios Playwright back-office, 81 scénarios Playwright client.

## Ordre exact des slides

1. TASTIFY
2. PLAN DE LA PRÉSENTATION
3. FLUX DE RESTAURATION
4. Problématique
5. Étude de l’existant
6. Solution proposée : Tastify
7. Conception
8. Architecture de Tastify
9. Prise de commande et transmission au KDS
10. Traitement d’un avis client
11. Réalisation
12. Machine Learning et Deep Learning
13. Étapes du pipeline d’analyse de sentiment
14. Outils et technologies utilisés
15. Modèles utilisés pour l’analyse de sentiment
16. Comparaison des performances
17. Métriques du pipeline principal
18. DÉMONSTRATION DE L'APPLICATION TASTIFY
19. Défis rencontrés et solutions
20. Conclusion et perspectives
21. Merci / Questions-Réponses

## Éléments non trouvés ou à présenter comme limites

- Pas de paiement bancaire réel intégré : le flux actuel simule le paiement et réconcilie commande/table.
- Pas de campagne de charge complète finalisée : le rapport indique une base à compléter.
- Pas d'entraînement local complet des modèles BERT/MARBERT : usage de modèles pré-entraînés/fine-tunés via Hugging Face.
- Corpus d’évaluation IA réduit : 15 avis annotés manuellement ; résultats indicatifs.
- Détection de langue simple : arabe si caractères arabes, sinon route non arabe.
- Fallback local lexical : utile pour continuité de démo, mais limité face à l’ironie, aux négations complexes et à la darija latinisée.
- Déploiement production complet non finalisé : HTTPS, monitoring, sauvegardes et rotation des secrets restent en perspectives.

## Incohérences ou risques à surveiller

- La slide 16 affiche 0,93 d'accuracy pour le pipeline principal ; il faut préciser que cette valeur vient d'un petit corpus de validation de 15 avis.
- La présentation dit "temps réel" ; il faut toujours rattacher ce terme à WebSocket + Redis, pas à une garantie de performance mesurée.
- La slide 13 parle maintenant explicitement de modèles pré-entraînés et fine-tunés par leurs auteurs ; c'est une bonne correction, mais il faut continuer à ne pas dire "nous avons entraîné BERT ou MARBERT".
- La présentation mentionne Tastify comme ERP restaurant ; préciser que c'est un prototype académique de type mini-ERP métier.
- Les recommandations de plats combinent l’exploitation des avis/sentiment et une base de cooccurrence prévue dans le module menu ; ne pas présenter cela comme un moteur de recommandation industriel.

## Avis rapide sur la présentation mise à jour

- Très bonne amélioration : les slides de séparation `Conception` et `Réalisation` rendent le récit plus clair et moins brutal.
- La slide de démonstration intégrée est utile : elle indique au jury qu'une démo courte est prévue et évite d'improviser le moment de lancement.
- La présentation est maintenant plus longue : 21 slides pour 10 minutes. Il faut donc parler vite mais calmement, avec des slides de transition traitées en 10 à 15 secondes.
- Le point le plus fort visuellement est la cohérence sobre : blanc, bleu foncé, accent orange, tableaux simples.
- Le point à surveiller est la densité de certaines slides techniques, surtout les diagrammes de séquence et le pipeline. Il faut les expliquer en intention, sans lire chaque bloc.

## Formulations à éviter devant le jury

- "Nous avons développé un paiement réel." Dire plutôt : "Nous avons simulé le paiement et préparé une architecture extensible vers un prestataire."
- "Nous avons entraîné BERT/MARBERT." Dire plutôt : "Nous utilisons des modèles pré-entraînés/fine-tunés via Hugging Face."
- "Le modèle est très performant." Dire plutôt : "Sur notre corpus indicatif de 15 avis, le pipeline principal obtient 0,93 d'accuracy."
- "L'application est prête pour la production." Dire plutôt : "L'application est prête pour la démonstration locale et structurée pour évoluer vers la production."
- "Le système est temps réel partout." Dire plutôt : "Les notifications staff et le KDS utilisent WebSocket avec Redis."
- "Le fallback est aussi bon que le modèle principal." Dire plutôt : "Le fallback assure la continuité, mais il reste lexical et limité."

## Points qui risquent d’être questionnés

- Pourquoi utiliser deux frontends au lieu d’une seule interface ?
- Pourquoi Django REST Framework plutôt qu’un backend plus simple ?
- Comment les rôles sont-ils réellement sécurisés côté API ?
- Que se passe-t-il si Redis, Celery ou Hugging Face est indisponible ?
- Le paiement QR est-il un vrai paiement bancaire ?
- Pourquoi parler de Deep Learning si les modèles sont appelés via API ?
- Comment justifier les métriques IA avec seulement 15 avis ?
- Quelle est la différence entre les résultats du fallback et du pipeline principal ?
- Quels modules sont vraiment développés et lesquels sont des perspectives ?
- Quelle a été la contribution de chaque étudiant ?
