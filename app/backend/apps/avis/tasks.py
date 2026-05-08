import logging
import requests
import time
from celery import shared_task
from django.apps import apps
from decouple import config

logger = logging.getLogger(__name__)

HF_MODEL_NAME = config(
    'HF_MODEL_NAME',
    default='nlptown/bert-base-multilingual-uncased-sentiment',
)


def get_hf_api_token():
    raw_token = config('HUGGINGFACE_API_TOKEN', default='').strip()
    if raw_token.lower().startswith('bearer '):
        return raw_token[7:].strip()
    return raw_token


def get_hf_api_url():
    return f'https://router.huggingface.co/hf-inference/models/{HF_MODEL_NAME}'

def query_hf_api(text):
    """Sends a request to the Hugging Face Inference API."""
    token = get_hf_api_token()

    if not token:
        logger.warning("HUGGINGFACE_API_TOKEN is not set.")
        return None

    if not token.startswith('hf_'):
        logger.warning("HUGGINGFACE_API_TOKEN does not look like a valid HF token (should start with hf_)")

    headers = {"Authorization": f"Bearer {token}"}
    payload = {"inputs": text}
    
    for attempt in range(3):
        try:
            response = requests.post(
                get_hf_api_url(),
                headers=headers,
                json=payload,
                timeout=15,
            )
            
            if response.status_code == 200:
                return response.json()
            
            if response.status_code == 503:
                # Model is loading
                data = response.json()
                wait_time = data.get('estimated_time', 10)
                logger.info(f"HF Model is loading. Waiting {wait_time}s (Attempt {attempt+1}/3)...")
                time.sleep(min(wait_time, 15))
                continue
                
            logger.error(f"HF API Error {response.status_code}: {response.text}")
            break
        except requests.exceptions.RequestException as e:
            logger.error(f"HF API Request failed: {str(e)}")
            time.sleep(2)
            
    return None

@shared_task
def analyze_review_sentiment(avis_id):
    """
    Analyzes the sentiment of a review using Hugging Face Inference API.
    Updates the sentiment_score (1-5 stars).
    """
    Avis = apps.get_model('avis', 'Avis')
    try:
        avis = Avis.objects.get(id=avis_id)
        if not avis.commentaire:
            return "No commentary to analyze"

        output = query_hf_api(avis.commentaire[:512])
        
        if not output:
            return f"Failed to get API response for Avis {avis_id}"

        # API response is usually [[{'label': 'X stars', 'score': ...}, ...]]
        try:
            # Flatten if nested list
            if isinstance(output, list) and len(output) > 0 and isinstance(output[0], list):
                results = output[0]
            elif isinstance(output, list):
                results = output
            else:
                return f"Unexpected API output format: {type(output)}"

            # Pick the best result
            best_match = max(results, key=lambda x: x['score'])
            label = best_match['label']
            
            # Label format is "1 star", "2 stars", etc.
            score = int(label.split()[0])
            
            avis.sentiment_score = score
            avis.save(update_fields=['sentiment_score', 'updated_at'])
            return f"Sentiment analyzed: {score} stars"
            
        except (ValueError, IndexError, KeyError, TypeError) as e:
            logger.error(f"Error parsing HF response for Avis {avis_id}: {str(e)}")
            return f"Parse error: {str(e)}"
        
    except Avis.DoesNotExist:
        return f"Avis {avis_id} not found"
    except Exception as e:
        logger.exception(f"Unexpected error in sentiment task for Avis {avis_id}")
        return f"Error: {str(e)}"
