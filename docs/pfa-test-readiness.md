# PFA test readiness

Ce fichier sert de pense-bete pour la derniere validation avant soutenance.

## Commande finale recommandee

Depuis la racine du projet:

```powershell
.\run-pfa-readiness.bat
```

La commande lance:

- la suite locale complete avec rebuild Docker: `.\scripts\run-all-tests.ps1 -Rebuild`;
- les scenarios cross-app jury: `npm run test:e2e:cross-app`;
- la matrice responsive/browser rapide: `npm run test:e2e:matrix`.

Un rapport date est ecrit dans `output/pfa-test-readiness-*.md`.

## Commandes rapides de rehearsal

Pour verifier uniquement les ajouts recents sans relancer toute la pile:

```powershell
docker compose exec -T -e DJANGO_SETTINGS_MODULE=tastify_backend.settings.test backend python -m pytest apps/loyalty -q
npm --prefix app/frontend/client-app run test:e2e -- tests/e2e/client.account-loyalty.spec.ts
npm --prefix app/frontend/backoffice-app run test:e2e -- tests/e2e/backoffice.gerant.spec.ts
```

## Lecture attendue

- `PASS`: pret pour repetition PFA.
- `FAIL`: corriger avant soutenance.
- `SKIP`: acceptable uniquement pour un rehearsal rapide, pas pour la validation finale.
