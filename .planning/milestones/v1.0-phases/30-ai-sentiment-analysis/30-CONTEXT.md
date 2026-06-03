# Phase 30: AI Sentiment Analysis - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 30 focuses on implementing a review system for dishes and analyzing customer sentiment using AI.
This involves:
1. Creating a dedicated `avis` Django app.
2. Implementing a `Avis` model linked to `Utilisateur` and `Plat`.
3. Integrating HuggingFace Inference API for BERT sentiment analysis (`nlptown/bert-base-multilingual-uncased-sentiment`).
4. Exposing endpoints for clients to submit reviews and for gérants to view analyzed feedback.
</domain>

<decisions>
## Implementation Decisions

### 1. New App: `apps.avis`
- A new Django app `avis` will be created to house review models and logic.
- This aligns with the performance index requirements in the Cahier de Charges.

### 2. Review Target: Per-Dish
- Reviews will be linked to specific `Plat` objects.
- This allows the AI Recommender (Phase 29) to eventually use sentiment scores as weights.

### 3. AI: HuggingFace Inference API
- We will use the HuggingFace Inference API instead of loading the model locally.
- This keeps the Docker image small and avoids high memory usage on the backend container.
- **Model**: `nlptown/bert-base-multilingual-uncased-sentiment`.
- **Secret**: `HUGGINGFACE_API_KEY` must be added to `.env`.

### 4. Sentiment Storage
- The sentiment result (score 1-5 stars or label POSITIVE/NEGATIVE) will be stored in the database alongside the review text.
- This avoids re-calling the API when displaying reviews.

### 5. UI Integration
- **Portail Client**: Add a review section for dishes that the user has previously ordered.
- **Back-Office**: Gérant can see a list of recent reviews with their AI-determined sentiment.
</decisions>

<code_context>
## Existing Code Insights

- **Models**: `Plat` exists in `apps.menu`. `Utilisateur` exists in `apps.users`.
- **Auth**: JWT role-based access is already established.
- **Celery**: Available if we decide to run sentiment analysis in the background (though API latency is small).
</code_context>

<specifics>
## Specific Requirements

- **Endpoint**: `POST /api/ia/analyser-avis/` (as per Cahier).
- **Endpoint**: `POST /api/avis/` for submitting the actual review.
- **RBAC**: Only `CLIENT` can create reviews for their own consumption history. `GERANT` can see all.
</specifics>

<deferred>
## Deferred Ideas

- **Multilingual Nuances**: Deep refinement for Moroccan Darija (deferred to Phase 38).
- **Automatic Stock Forecasting**: Weather-aware prediction (deferred to Phase 37).
</deferred>
