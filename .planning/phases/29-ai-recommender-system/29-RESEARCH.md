<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
The recommender system should suggest dishes to users based on collaborative filtering or content-based recommendations using scikit-learn.
Expose recommendations via a REST API endpoint.
Integrate this in the Portail Client React app to display a "Recommended for you" section.

### Claude's Discretion
All implementation choices are at Claude's discretion. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

# Phase 29: AI Recommender System - Research

**Researched:** 2026-05-08 (Simulated)
**Domain:** Machine Learning / API Integration
**Confidence:** HIGH

## Summary

This phase introduces an AI-driven Recommender System into the Tastify application using `scikit-learn`. The system leverages historical order data (`CommandeLigne`) to identify patterns and suggest dishes (`Plats`) that are frequently purchased together. This is a classic Market Basket Analysis or Item-Based Collaborative Filtering problem.

Given the nature of the application (restaurant ordering), we will implement an item-to-item similarity matrix. The heavy lifting (matrix factorization and cosine similarity computation) will be offloaded to an asynchronous Celery task. The results will be cached in Redis for fast retrieval by the Django REST API, which will then serve them to the React frontend (Portail Client) to populate a "Recommended for you" UI section.

**Primary recommendation:** Use `TruncatedSVD` and `cosine_similarity` from `scikit-learn` in a scheduled Celery task to generate an item-similarity matrix, cache it in Redis, and expose it via an extra `@action` on the `PlatViewSet`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Matrix Computation | Celery Worker | — | SVD and similarity calculations are CPU/memory-intensive and must not block API requests. |
| Recommendation Storage | Redis (Cache) | Database (fallback) | Fast O(1) lookups during API calls without recalculating or querying complex tables. |
| Recommendation API | API / Backend | — | DRF exposes a `/api/menu/plats/<id>/recommendations/` endpoint mapping cached IDs to `Plat` models. |
| Presentation | Browser / Client | — | The React Portail Client fetches and displays the "Recommended for you" carousel/grid. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `scikit-learn` | 1.4.1+ | Matrix operations, SVD, Cosine Similarity | Industry standard for machine learning in Python; stable and well-documented. |
| `pandas` | 2.2.1+ | Data manipulation | Simplifies pivoting `CommandeLigne` rows into a user-item matrix before feeding to scikit-learn. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `redis` | 5.0.8 | In-memory storage | To cache the `item_similarity_dict` so the API doesn't compute it per request. |
| `scipy` | 1.13.0+ | Sparse matrices | If the `Commande` matrix becomes too large, `scipy.sparse.csr_matrix` is required for memory efficiency. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Item-Based CF (SVD) | Apriori / FP-Growth | Apriori yields strict association rules but can be too rigid and slow for sparse menus. SVD + Cosine similarity is faster and captures latent relationships better. |
| Celery Task | On-the-fly computation | Computing similarity on every API call would severely degrade performance. Celery is already part of the stack. |

**Installation:**
```bash
# In the backend container/environment:
pip install scikit-learn pandas
```

**Version verification:** 
```bash
npm view scikit-learn version # Not applicable for Python
pip index versions scikit-learn # Found 1.8.0, 1.4.1+ recommended
pip index versions pandas # Found 3.0.2, 2.2.3+ recommended
```

## Architecture Patterns

### System Architecture Diagram

1. `CommandeLigne` Data -> Celery Task (`compute_recommendations_task`).
2. Celery Task -> Pandas Pivot Table (Orders x Plats).
3. Pandas Pivot -> `scikit-learn` `TruncatedSVD` -> `cosine_similarity`.
4. Similarity Output -> Redis Cache (Key: `recommendations:<plat_id>`, Value: `[plat_id_1, plat_id_2]`).
5. Portail Client -> `GET /api/menu/plats/<id>/recommendations/` -> Django Backend.
6. Django Backend -> Fetch from Redis -> Serialize `Plat` objects -> Return to Client.

### Recommended Project Structure
```
app/backend/apps/menu/
├── ml/
│   ├── __init__.py
│   └── recommender.py    # scikit-learn logic
├── tasks.py              # Celery task calling recommender.py
└── views.py              # New @action in PlatViewSet
```

### Pattern 1: Asynchronous Recommendation Computation
**What:** Offload the generation of the item-similarity matrix to Celery, running periodically (e.g., nightly or hourly) via `django-celery-beat`.
**When to use:** Whenever dataset size makes synchronous calculation > 500ms.
**Example:**
```python
# app/backend/apps/menu/tasks.py
from celery import shared_task
from django.core.cache import cache
from .ml.recommender import generate_item_similarities

@shared_task
def update_recommendations():
    similarities = generate_item_similarities()
    cache.set('plat_similarities', similarities, timeout=None)
```

### Anti-Patterns to Avoid
- **Synchronous ML in API Views:** Loading DataFrames and fitting SVDs inside a `ViewSet` method will block the server and lead to timeouts.
- **Loading full objects into memory:** Use `CommandeLigne.objects.values('commande_id', 'plat_id', 'quantite')` rather than instantiating full model objects when building the training matrix.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cosine Similarity | Custom nested loops over matrices | `sklearn.metrics.pairwise.cosine_similarity` | Highly optimized C-level execution via numpy/scipy. |
| Dimensionality Reduction | Custom PCA | `sklearn.decomposition.TruncatedSVD` | Specifically optimized for sparse matrices without centering them first (which would break sparsity). |
| Matrix Pivoting | Python `defaultdict` / loops | `pandas.DataFrame.pivot_table` | Significantly faster and handles missing values elegantly. |

## Common Pitfalls

### Pitfall 1: Cold Start Problem
**What goes wrong:** New items (plats) or items with zero historical orders receive no recommendations or break the matrix computation.
**Why it happens:** The SVD matrix requires variance. A column with all zeros provides no information.
**How to avoid:** Implement a fallback in the API. If `plat_id` isn't in the similarity cache, fallback to returning the top 5 most popular `Plats` globally.

### Pitfall 2: Memory Bloat with Dense Matrices
**What goes wrong:** The Celery task crashes due to Out-Of-Memory (OOM) errors.
**Why it happens:** If there are 10,000 orders and 200 plats, a dense pivot table uses minimal memory. But at 1M orders, it explodes.
**How to avoid:** Convert the Pandas pivot table to a `scipy.sparse.csr_matrix` before feeding it to `TruncatedSVD`.

## Code Examples

### Scikit-Learn SVD + Cosine Similarity Pipeline
```python
# Source: scikit-learn official docs (adapted for Django/Pandas)
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity

def compute_similarities(queryset_values):
    df = pd.DataFrame(list(queryset_values))
    if df.empty: return {}
    
    # Pivot: rows=commandes, cols=plats, values=quantite
    user_item = df.pivot_table(index='commande_id', columns='plat_id', values='quantite', fill_value=0)
    
    # Optional dimensionality reduction (LSA)
    svd = TruncatedSVD(n_components=min(20, user_item.shape[1] - 1))
    item_factors = svd.fit_transform(user_item.T)
    
    # Compute similarity between items
    sim_matrix = cosine_similarity(item_factors)
    
    # Map back to plat_ids
    plat_ids = user_item.columns
    recommendations = {}
    for idx, plat_id in enumerate(plat_ids):
        # Get top 5 most similar items (excluding self)
        similar_indices = sim_matrix[idx].argsort()[::-1][1:6]
        recommendations[plat_id] = [plat_ids[i] for i in similar_indices]
        
    return recommendations
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Apriori algorithm | Matrix Factorization (SVD) | Mid 2010s | Handles sparse datasets better and captures latent associations (e.g., items that are similar even if rarely bought together directly). |
| Custom dict caching | Redis caching | Always | Ensures distributed workers and web processes share the same recommendation model state. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Portail Client has a UI structure where a "Recommended for you" section can naturally fit. | Summary / Context | [MEDIUM] If there's no Menu/Cart UI yet, Phase 29 might require building foundational UI elements just to host the recommendations. |
| A2 | `redis` is configured and available as Django's default cache. | Standard Stack | [LOW] If not, similarities must be stored in the SQL database, which is slightly slower but acceptable. |

## Open Questions (RESOLVED)

1. **How should the Portail Client trigger recommendations if the user is completely anonymous and hasn't started a cart?**
   - What we know: The portal handles payment and reservations, and is getting a "Recommended for you" section.
   - What's unclear: Should we show global popular items on the home page, or wait until they view a specific `Plat`?
   - Recommendation: Add two API behaviors: `GET /api/menu/plats/recommendations/` (global popularity) and `GET /api/menu/plats/<id>/recommendations/` (item-based CF).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `scikit-learn` | Matrix logic | ✗ | — | Needs to be added to `requirements.txt` |
| `pandas` | Matrix formatting | ✗ | — | Needs to be added to `requirements.txt` |
| Redis | Recommendation Caching | ✓ | 5.0.8 | Django Database Cache |
| Celery | Async Processing | ✓ | 5.6.3 | Synchronous execution (Not recommended) |

**Missing dependencies with fallback:**
- `scikit-learn` & `pandas`: Must be installed. The Planner must include a task to update `app/backend/requirements.txt` and the Dockerfile.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest / vitest |
| Config file | `app/backend/pytest.ini` / `app/frontend/portail/vite.config.ts` |
| Quick run command | `pytest app/backend/apps/menu/tests/` |
| Full suite command | `pytest` / `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-29-1 | Scikit-learn similarity task computes valid dict from mocked Commandes | unit | `pytest app/backend/apps/menu/tests/test_recommender.py` | ❌ Wave 0 |
| REQ-29-2 | `GET /api/menu/plats/<id>/recommendations/` returns serialized Plats | integration | `pytest app/backend/apps/menu/tests/test_views_recommendation.py` | ❌ Wave 0 |
| REQ-29-3 | Portail React component renders recommendation carousel | unit | `npm run test -- -t "RecommendationList"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pytest app/backend/apps/menu/tests/`
- **Per wave merge:** full suite backend and frontend
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/backend/apps/menu/tests/test_recommender.py` — covers REQ-29-1
- [ ] `app/backend/apps/menu/tests/test_views_recommendation.py` — covers REQ-29-2

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `IsAuthenticated` for staff, public read for clients |
| V5 Input Validation | yes | Validate `plat_id` is numeric/UUID in the URL. |

### Known Threat Patterns for AI/ML APIs

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Insecure Model Deserialization | Tampering | Do not pickle model objects; we are only caching the output dictionary (plat ID to list of plat IDs). |
| Denial of Service (DoS) via Matrix Compute | Availability | Compute matrices entirely offline in Celery, not triggered synchronously by API endpoints. |

## Sources

### Primary (HIGH confidence)
- `/websites/scikit-learn_stable` - TruncatedSVD and cosine_similarity documentation (Verified via Context7 MCP).
- `app/backend/requirements.txt` - Project dependencies check.

### Secondary (MEDIUM confidence)
- Internal Models (`app/backend/apps/commandes/models.py`, `app/backend/apps/menu/models.py`) - Verified relationships between Commande, CommandeLigne, and Plat.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Scikit-learn and pandas are the defacto standards for this.
- Architecture: HIGH - Offloading to Celery and caching in Redis is the optimal pattern for Django web servers.
- Pitfalls: HIGH - Cold start and sparse matrix memory issues are canonical ML problems.

**Research date:** 2026-05-08
**Valid until:** 2026-06-08