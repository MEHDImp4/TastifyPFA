from celery import shared_task
from django.core.cache import cache
from apps.commandes.models import CommandeLigne
from apps.menu.ml.recommender import compute_similarities

@shared_task(name='update_recommendations')
def update_recommendations():
    data = list(CommandeLigne.objects.values('commande_id', 'plat_id', 'quantite'))
    similarities = compute_similarities(data)
    cache.set('plat_similarities', similarities, timeout=None)
    return "Recommendations updated."
