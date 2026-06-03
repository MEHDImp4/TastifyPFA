# Phase 30: AI Sentiment Analysis Research

## Standard Stack
- `transformers` (HuggingFace library for BERT and pipelines)
- `torch` (PyTorch, CPU-only version for Docker to save space)
- `celery` (Already in stack, used for asynchronous inference)
- Base model: `nlptown/bert-base-multilingual-uncased-sentiment` (A good starting point that supports multiple languages including English and French, predicting 1-5 stars. We can refine it in Phase 38).

## Architecture Patterns
- **Asynchronous Processing**: Sentiment inference is computationally heavy and should never happen in the synchronous request-response cycle. DRF should save the review, enqueue a Celery task, and return a 201 Created immediately.
- **Lazy Singleton Loading**: The HuggingFace pipeline should be loaded lazily in the Celery worker. Loading it at the module level of `tasks.py` ensures it's initialized once per worker process, rather than per task or in the web process.
- **App Structure**: Create a new `avis` (reviews) app to hold the `Avis` model, linking to a `Commande` (or `Plat`), the `User` (client), a `commentaire` (text), `note` (user's given rating 1-5), and `sentiment_score` (AI calculated rating).

## Don't Hand-Roll
- **Custom NLP Preprocessing**: Rely entirely on the `transformers.pipeline` for tokenization, padding, and truncation.
- **Microservices**: Do not build a separate Python microservice (e.g., FastAPI) just for this inference at this stage. Celery workers are perfectly capable of handling this load for an MVP.
- **Synchronous Execution**: Do not run the model in the DRF view.

## Common Pitfalls
- **Docker Image Size**: Installing default `torch` pulls CUDA dependencies, adding >2GB to the image. Must explicitly install the `cpu` version of PyTorch in `requirements.txt`.
- **Repeated Model Downloads**: `transformers` downloads the model on first use. If not cached, the Celery task will take a long time on the first run after a container restart. The HuggingFace cache directory (`/root/.cache/huggingface` or `/app/cache`) should be mounted as a Docker volume or the model downloaded during the Docker build.
- **Memory Leaks**: Creating a new `pipeline` inside the task function for every review will quickly exhaust worker memory. It must be cached as a global variable.

## Code Examples

### Lazy Loaded Inference Task
```python
# apps/avis/tasks.py
from celery import shared_task
from django.conf import settings

# Global variable to cache the pipeline in the worker process
_sentiment_pipeline = None

def get_pipeline():
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        from transformers import pipeline
        # Lazy load to prevent loading in web process or on every task
        _sentiment_pipeline = pipeline(
            "sentiment-analysis", 
            model="nlptown/bert-base-multilingual-uncased-sentiment"
        )
    return _sentiment_pipeline

@shared_task
def analyze_review_sentiment(review_id):
    from apps.avis.models import Avis
    try:
        avis = Avis.objects.get(id=review_id)
        if not avis.commentaire:
            return
            
        nlp_pipeline = get_pipeline()
        
        # Truncate text if needed (BERT max length is usually 512 tokens)
        result = nlp_pipeline(avis.commentaire[:1500])[0]
        
        # Result format for this model is like {'label': '5 stars', 'score': 0.8}
        label = result.get('label', '')
        score_match = [int(s) for s in label.split() if s.isdigit()]
        
        if score_match:
            avis.sentiment_score = score_match[0]
            avis.save(update_fields=['sentiment_score'])
            
    except Avis.DoesNotExist:
        pass
```

### requirements.txt additions
```text
--extra-index-url https://download.pytorch.org/whl/cpu
torch==2.2.2+cpu
transformers==4.39.3
```