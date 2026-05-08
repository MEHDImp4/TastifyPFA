import logging
from celery import shared_task
from django.apps import apps

logger = logging.getLogger(__name__)

# Global variable for the sentiment analyzer pipeline
_sentiment_analyzer = None

def get_sentiment_analyzer():
    """Lazy load the sentiment analyzer pipeline."""
    global _sentiment_analyzer
    if _sentiment_analyzer is None:
        from transformers import pipeline
        logger.info("Loading sentiment analysis pipeline...")
        # Using a model that supports multiple languages (English, French, etc.)
        _sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="nlptown/bert-base-multilingual-uncased-sentiment"
        )
    return _sentiment_analyzer

@shared_task
def analyze_review_sentiment(avis_id):
    """
    Analyzes the sentiment of a review and updates the sentiment_score.
    The model nlptown/bert-base-multilingual-uncased-sentiment returns 1-5 stars.
    """
    Avis = apps.get_model('avis', 'Avis')
    try:
        avis = Avis.objects.get(id=avis_id)
        if not avis.commentaire:
            return "No commentary to analyze"

        analyzer = get_sentiment_analyzer()
        # Truncate to 512 characters/tokens (model limit)
        result = analyzer(avis.commentaire[:512])[0]
        
        # The labels are '1 star', '2 stars', ..., '5 stars'
        label = result['label']
        try:
            score = int(label.split()[0])
        except (ValueError, IndexError):
            # Fallback if label format changes
            score = None
            
        if score is not None:
            avis.sentiment_score = score
            avis.save(update_fields=['sentiment_score', 'updated_at'])
            return f"Sentiment analyzed: {score} stars"
        
        return "Could not parse sentiment score"
        
    except Avis.DoesNotExist:
        logger.error(f"Avis with id {avis_id} not found")
        return f"Avis {avis_id} not found"
    except Exception as e:
        logger.exception(f"Error analyzing sentiment for Avis {avis_id}: {str(e)}")
        return f"Error: {str(e)}"
