import logging
import requests
import time
import re
from celery import shared_task
from django.apps import apps
from decouple import config
from langdetect import detect, DetectorFactory

# Set seed for deterministic language detection
DetectorFactory.seed = 0

logger = logging.getLogger(__name__)

# Models and URLs
MODEL_MAP = {
    'multilingual': 'nlptown/bert-base-multilingual-uncased-sentiment',
    'arabic': 'moussaKam/MARBERT-sentiment', 
}

# Fallback for Arabic if specialized model is not supported by Inference API
ARABIC_FALLBACK = 'nlptown/bert-base-multilingual-uncased-sentiment'

def get_hf_api_token():
    raw_token = config('HUGGINGFACE_API_TOKEN', default='').strip()
    if raw_token.lower().startswith('bearer '):
        return raw_token[7:].strip()
    return raw_token

def query_hf_api(text, model_name):
    """Sends a request to the Hugging Face Inference API."""
    token = get_hf_api_token()
    if not token:
        logger.warning("HUGGINGFACE_API_TOKEN is not set.")
        return None

    url = f'https://router.huggingface.co/hf-inference/models/{model_name}'
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"inputs": text}
    
    for attempt in range(3):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=15)
            if response.status_code == 200:
                return response.json()
            if response.status_code == 503:
                data = response.json()
                wait_time = data.get('estimated_time', 10)
                time.sleep(min(wait_time, 15))
                continue
            logger.error(f"HF API Error {response.status_code}: {response.text}")
            break
        except requests.exceptions.RequestException as e:
            logger.error(f"HF API Request failed: {str(e)}")
            time.sleep(2)
    return None

def detect_language(text):
    """
    Heuristic for language detection.
    """
    # 1. Simple Regex for Arabic characters
    if re.search(r'[\u0600-\u06FF]', text):
        return 'ar'
    
    # 2. Use langdetect for others
    try:
        return detect(text)
    except:
        return 'unknown'

@shared_task(name="apps.avis.tasks.analyze_review_sentiment")
def analyze_review_sentiment(avis_id):
    """
    Analyzes review sentiment with language-specific model routing.
    """
    Avis = apps.get_model('avis', 'Avis')
    try:
        avis = Avis.objects.get(id=avis_id)
        if not avis.commentaire:
            return "No commentary"

        # Detect language
        lang = detect_language(avis.commentaire)
        avis.lang_code = lang
        
        # Route to model
        model = MODEL_MAP['arabic'] if lang == 'ar' else MODEL_MAP['multilingual']
        
        output = query_hf_api(avis.commentaire[:512], model)
        
        # If Arabic specialized model failed (or returned error), try fallback
        if not output and lang == 'ar':
            logger.info(f"Falling back to multilingual for Arabic review {avis_id}")
            model = ARABIC_FALLBACK
            output = query_hf_api(avis.commentaire[:512], model)

        if output:
            # Handle potential list or single result from API
            results = output[0] if isinstance(output[0], list) else output
            best = max(results, key=lambda x: x['score'])
            
            label = best['label'].upper()
            
            if 'LABEL_' in label or 'POSITIVE' in label or 'NEGATIVE' in label:
                # Handling specialized models (Positive/Negative/Neutral)
                # MARBERT: LABEL_0=Neg, LABEL_1=Neu, LABEL_2=Pos
                if 'LABEL_2' in label or 'POSITIVE' in label: score = 5
                elif 'LABEL_1' in label or 'NEUTRAL' in label: score = 3
                else: score = 1
            else:
                # Handling nlptown star format ("X stars")
                score = int(label.split()[0])
            
            avis.sentiment_score = score
        
        avis.save(update_fields=['sentiment_score', 'lang_code', 'updated_at'])
        return f"Sentiment analyzed ({lang}) using {model}: {avis.sentiment_score} stars"
        
    except Exception as e:
        logger.exception(f"Error in sentiment task for Avis {avis_id}")
        return str(e)
