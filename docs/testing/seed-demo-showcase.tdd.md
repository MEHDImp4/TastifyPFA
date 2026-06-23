# Seed Demo Showcase TDD Evidence

## Source Plan
Derived from the user request to create realistic, replayable PFA demo data for Tastify.

## User Journeys
- As the PFA presenter, I want one command to load coherent restaurant data so the dashboard, salle, KDS, loyalty, and reviews look like a real restaurant.
- As the PFA presenter, I want reviews analysed through the sentiment pipeline once so the demo can show stored AI results reliably.
- As the PFA presenter, I want the demo script to avoid duplicate data in fast mode and regenerate clean data in reset mode.

## Task Report
| Behavior | Validation command | Result | Evidence |
|---|---|---|---|
| RED: missing command is detected | `docker compose exec -T backend sh -c "DJANGO_SETTINGS_MODULE=tastify_backend.settings.test pytest core/tests/test_seed_demo_showcase.py -q"` | FAIL | `AttributeError: module 'core.management.commands' has no attribute 'seed_demo_showcase'` |
| GREEN: showcase data populates dashboard, tables, KDS, avis, loyalty, and `--require-hf` failure | `docker compose exec -T backend sh -c "DJANGO_SETTINGS_MODULE=tastify_backend.settings.test pytest core/tests/test_seed_demo_showcase.py -q"` | PASS | `3 passed in 71.60s` |
| Static Python syntax before final script/test additions | `python -m py_compile core\management\commands\seed_demo_showcase.py core\tests\test_seed_demo_showcase.py` | PASS | Command exited successfully before the final `--require-hf` test addition |

## Test Specification
| # | What is guaranteed | Test file or command | Type | Result |
|---|---|---|---|---|
| 1 | Demo seed creates non-zero daily revenue and a 7-day revenue series | `app/backend/core/tests/test_seed_demo_showcase.py` | Integration | PASS |
| 2 | Occupied tables are spread across the plan, including 1, 3, 4, 16, and 25 | `app/backend/core/tests/test_seed_demo_showcase.py` | Integration | PASS |
| 3 | Active orders feed KDS states: waiting, preparing, and ready | `app/backend/core/tests/test_seed_demo_showcase.py` | Integration | PASS |
| 4 | Every seeded review has one stored sentiment analysis and mixed labels | `app/backend/core/tests/test_seed_demo_showcase.py` | Integration | PASS |
| 5 | Loyalty profiles cover Bronze, Silver, and Gold habitués with transaction history | `app/backend/core/tests/test_seed_demo_showcase.py` | Integration | PASS |
| 6 | Running the seed twice does not duplicate commandes, paiements, or avis | `app/backend/core/tests/test_seed_demo_showcase.py` | Integration | PASS |
| 7 | `--require-hf` fails clearly when `HUGGINGFACE_API_TOKEN` is missing | `app/backend/core/tests/test_seed_demo_showcase.py` | Integration | PASS |

## Coverage And Known Gaps
- The targeted pytest run reported overall coverage for the selected run, but not 80% global coverage because only one focused test file was executed.
- The final focused test run passed after adding the `--require-hf` assertion.
