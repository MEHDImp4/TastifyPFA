from celery import shared_task

@shared_task(name='update_recommendations')
def update_recommendations():
    # Simple rule-based dummy return since SVD/Cosine similarity recommendations are disabled.
    return "Recommendations task skipped (using DB-driven recommendations)."
