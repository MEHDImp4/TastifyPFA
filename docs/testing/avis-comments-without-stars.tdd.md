# Avis sans etoiles - Rapport TDD

## Source

Plan derive de la demande utilisateur: supprimer le systeme d'etoiles des commentaires de plats et garder seulement les commentaires ecrits.

## Parcours utilisateur

- En tant que client, je veux commenter un plat paye sans choisir d'etoiles, afin que mon avis soit uniquement textuel.
- En tant que visiteur du menu, je veux voir le nombre d'avis sans note moyenne artificielle, afin que la carte ne montre pas de notation par etoiles.
- En tant que gerant, je veux consulter les avis par sentiment sans moyenne d'etoiles, afin de suivre les retours clients via les commentaires.

## RED/GREEN

| Comportement | RED | GREEN |
|---|---|---|
| Payload d'avis client sans `note` | `npm run test:unit -- src/pages/Payment/PaymentPortal.test.tsx src/pages/Menu/MenuPage.test.tsx --run` echouait: `buildReviewPayload is not a function` | Meme commande: 2 fichiers, 2 tests passes |
| Resume menu sans rating etoile | Meme commande echouait: `getPlatReviewSummary is not a function` | Meme commande: 2 fichiers, 2 tests passes |
| Stats backoffice sans note moyenne | `npm run test:unit -- src/pages/Avis/AvisPage.test.tsx --run` echouait: `calculateAvisStats is not a function` | Meme commande: 1 fichier, 1 test passe |

## Validation

| Garantie | Test / commande | Type | Resultat |
|---|---|---|---|
| L'avis envoye apres paiement contient `commande`, `plat`, `commentaire`, sans `note` | `src/pages/Payment/PaymentPortal.test.tsx` | Unit | PASS |
| La carte menu compte les avis textuels sans calcul de note | `src/pages/Menu/MenuPage.test.tsx` | Unit | PASS |
| Le backoffice compte total/positifs/neutres/negatifs sans moyenne d'etoiles | `src/pages/Avis/AvisPage.test.tsx` | Unit | PASS |
| Les tests backend avis/menu restent valides avec avis sans note obligatoire | `python -m pytest -o addopts='' apps\avis\tests.py apps\menu\tests\test_recommender.py -q` | Integration/unit | PASS: 15 passed |
| Le frontend client typecheck apres retrait des etoiles | `npm run typecheck` dans `app/frontend/client-app` | Typecheck | PASS |

## Gaps connus

- `npm run typecheck` dans `app/frontend/backoffice-app` echoue sur des erreurs existantes dans `src/pages/HR/HrPage.tsx`, sans lien avec les avis.
- La commande backend pytest standard lit `--cov` depuis `pytest.ini`, mais `pytest-cov` n'est pas disponible dans cet environnement; validation relancee avec `-o addopts=''`.
