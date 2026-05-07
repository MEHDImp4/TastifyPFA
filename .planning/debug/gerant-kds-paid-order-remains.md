---
status: completed
trigger: "the kds in the GERANT panel is not working right like for the CUISINIER"
created: 2026-05-07
updated: 2026-05-07
---

# Debug Session: gerant-kds-paid-order-remains

## Symptoms
- **Expected:** Après paiement d'une commande déjà validée dans le KDS, le KDS `GERANT` doit se comporter exactement comme `CUISINIER` et retirer la commande/les plats concernés.
- **Actual:** Dans le KDS `GERANT`, après paiement, la commande reste affichée et son état semble réinitialisé comme si elle n'avait jamais été servie.
- **Error Messages:** Aucun message d'erreur observé.
- **Timeline:** Non précisé; problème observé au 2026-05-07.
- **Reproduction:** Placer une commande, la valider dans le KDS, puis payer la commande. Observer qu'elle disparaît du KDS `CUISINIER` mais reste dans le KDS `GERANT`.

## Current Focus
- **hypothesis:** Le KDS `GERANT` retirait bien localement la commande sur l'événement websocket `order_updated`, puis la réinjectait immédiatement via un `fetchOrders()` trop large après paiement.
- **test:** Comparer le filtrage API utilisé par `CUISINIER` vs `GERANT`, puis valider que le refetch KDS `GERANT` recharge uniquement les statuts cuisine.
- **expecting:** Voir que `GERANT` refetch `/commandes/` sans scope cuisine, ce qui réhydrate les commandes payées, alors que `CUISINIER` reste déjà borné à `EN_CUISINE` et `PRETE`.
- **next_action:** completed

## Evidence
- timestamp: 2026-05-07 15:12:00
  finding: `handleSocketEvent` dans `app/frontend/backoffice/src/pages/Kds/store/useKdsStore.ts` supprime bien une commande quand son statut sort du scope cuisine (`PAYEE`, `ANNULEE`, `EN_COURS`).
- timestamp: 2026-05-07 15:13:00
  finding: `app/frontend/backoffice/src/pages/Kds/KdsSocketManager.tsx` déclenche un `fetchOrders()` après `order_updated`, ce qui écrase l'état local avec la réponse API la plus récente.
- timestamp: 2026-05-07 15:15:00
  finding: `app/backend/apps/commandes/views.py` filtrait déjà `CUISINIER` sur `EN_CUISINE` et `PRETE`, mais la liste `GERANT` restait large sans scope dédié pour le KDS.
- timestamp: 2026-05-07 15:18:00
  finding: Le correctif ajoute `scope=kitchen` au `fetchOrders()` du store KDS et supporte ce scope côté backend pour tous les rôles staff utilisant le KDS.
- timestamp: 2026-05-07 15:23:00
  finding: `npm run test -- src/pages/Kds/store/useKdsStore.test.ts --run` a réussi avec 17 tests passés.
- timestamp: 2026-05-07 15:24:00
  finding: `docker compose exec backend python manage.py test apps.commandes.tests.test_kds_permissions` échoue avant exécution métier car MySQL refuse la création de `test_tastify` pour l'utilisateur `tastify`.
- timestamp: 2026-05-07 15:25:00
  finding: `npm run build` a réussi dans `app/frontend/backoffice`.

## Eliminated
- Le traitement websocket frontend lui-même pour retirer une commande payée du KDS.
- Une divergence de comportement entre `GERANT` et `CUISINIER` au niveau du store KDS après réception de l'événement `order_updated`.

## Resolution
- **root_cause:** Le KDS `GERANT` rechargeait `/commandes/` après paiement sans scope cuisine. L'événement websocket retirait correctement la commande payée du store, mais le refetch backend la renvoyait aussitôt pour `GERANT`, contrairement à `CUISINIER` déjà borné aux statuts cuisine.
- **fix:** Ajout d'un scope API `kitchen` dans `CommandeViewSet.get_queryset()`, utilisation systématique de `scope=kitchen` dans `useKdsStore.fetchOrders()`, et ajout de tests de régression backend/frontend pour verrouiller le comportement.
- **validation:** Frontend ciblé validé par `npm run test -- src/pages/Kds/store/useKdsStore.test.ts --run` et `npm run build` dans `app/frontend/backoffice`. Validation backend ciblée bloquée par la configuration MySQL du conteneur de test (`Access denied for user 'tastify'@'%' to database 'test_tastify'`).
