import logging
from celery import shared_task
from django.apps import apps

logger = logging.getLogger(__name__)

SCORE_MAP = {
    'POSITIF': 15,
    'NEUTRE':   0,
    'NEGATIF': -15,
}

@shared_task(name="apps.avis.tasks.analyze_review_sentiment")
def analyze_review_sentiment(avis_id):
    """
    Analyses review sentiment via a deterministic rating-based rule engine.
    Ensures complete removal of AI/ML dependency models while preserving identical database schemas.
    """
    Avis = apps.get_model('avis', 'Avis')
    AnalyseSentiment = apps.get_model('avis', 'AnalyseSentiment')

    try:
        avis = Avis.objects.get(id=avis_id)
        if not avis.commentaire:
            return "No commentary"

        # Rule-based sentiment logic using evaluation note (stars rating)
        note = avis.note or 3
        if note >= 4:
            label = 'POSITIF'
        elif note <= 2:
            label = 'NEGATIF'
        else:
            label = 'NEUTRE'

        avis.lang_code = 'fr'

        # Persist detailed record matching the original DB schema
        AnalyseSentiment.objects.update_or_create(
            avis=avis,
            defaults={
                'label': label,
                'score_brut': 1.0,
                'modele_utilise': 'rule-based-sentiment-engine',
            },
        )

        avis.sentiment_score = SCORE_MAP[label]
        avis.save(update_fields=['sentiment_score', 'lang_code', 'updated_at'])

        return f"Rule-based sentiment analysed: {label} (score={avis.sentiment_score})"

    except Exception:
        logger.exception("Error in rule-based sentiment task for Avis %s", avis_id)
        raise
