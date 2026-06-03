import logging
import requests
import time
import re
from celery import shared_task
from django.apps import apps
from decouple import config
from langdetect import detect, DetectorFactory

from .sentiment_service import predict_sentiment

DetectorFactory.seed = 0

logger = logging.getLogger(__name__)

MODEL_MAP = {
    'multilingual': 'nlptown/bert-base-multilingual-uncased-sentiment',
    'arabic': 'moussaKam/MARBERT-sentiment',
}
ARABIC_FALLBACK = 'nlptown/bert-base-multilingual-uncased-sentiment'

# Maps canonical sentiment label → frontend-compatible integer score.
# AvisPage.tsx: score > 10 → POSITIVE, score < -10 → NEGATIVE, else NEUTRAL
SCORE_MAP = {
    'POSITIF': 15,
    'NEUTRE':   0,
    'NEGATIF': -15,
}


def get_hf_api_token():
    raw_token = config('HUGGINGFACE_API_TOKEN', default='').strip()
    if raw_token.lower().startswith('bearer '):
        return raw_token[7:].strip()
    return raw_token


def query_hf_api(text, model_name):
    token = get_hf_api_token()
    if not token:
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
            logger.error("HF API Error %s: %s", response.status_code, response.text)
            break
        except requests.exceptions.RequestException as e:
            logger.error("HF API Request failed: %s", str(e))
            time.sleep(2)
    return None


def _hf_output_to_label(output) -> tuple[str, float] | None:
    """Parse HF API response into (label, confidence)."""
    try:
        results = output[0] if isinstance(output[0], list) else output
        best = max(results, key=lambda x: x['score'])
        raw_label = best['label'].upper()
        confidence = float(best['score'])

        if 'LABEL_2' in raw_label or 'POSITIVE' in raw_label:
            return 'POSITIF', confidence
        if 'LABEL_0' in raw_label or 'NEGATIVE' in raw_label:
            return 'NEGATIF', confidence
        if 'LABEL_1' in raw_label or 'NEUTRAL' in raw_label:
            return 'NEUTRE', confidence

        # nlptown star format: "X stars" → 4-5=pos, 3=neu, 1-2=neg
        stars = int(raw_label.split()[0])
        if stars >= 4:
            return 'POSITIF', confidence
        if stars <= 2:
            return 'NEGATIF', confidence
        return 'NEUTRE', confidence
    except Exception:
        logger.exception("Failed to parse HF API output.")
        return None


def detect_language(text):
    if re.search(r'[؀-ۿ]', text):
        return 'ar'
    try:
        return detect(text)
    except Exception:
        return 'unknown'


@shared_task(name="apps.avis.tasks.analyze_review_sentiment")
def analyze_review_sentiment(avis_id):
    """
    Analyses review sentiment via HuggingFace Inference API (primary) then
    falls back to a local TF-IDF + LinearSVC pipeline when the token is absent
    or the API is unavailable.

    Saves a detailed AnalyseSentiment record and updates Avis.sentiment_score
    with a value compatible with the frontend scale (±15 / 0).
    """
    Avis = apps.get_model('avis', 'Avis')
    AnalyseSentiment = apps.get_model('avis', 'AnalyseSentiment')

    try:
        avis = Avis.objects.get(id=avis_id)
        if not avis.commentaire:
            return "No commentary"

        lang = detect_language(avis.commentaire)
        avis.lang_code = lang

        label = None
        confidence = 0.0
        model_used = None

        # --- Primary: HuggingFace Inference API ---
        if get_hf_api_token():
            hf_model = MODEL_MAP['arabic'] if lang == 'ar' else MODEL_MAP['multilingual']
            output = query_hf_api(avis.commentaire[:512], hf_model)

            if not output and lang == 'ar':
                logger.info("Falling back to multilingual for Arabic review %s", avis_id)
                hf_model = ARABIC_FALLBACK
                output = query_hf_api(avis.commentaire[:512], hf_model)

            if output:
                parsed = _hf_output_to_label(output)
                if parsed:
                    label, confidence = parsed
                    model_used = hf_model

        # --- Fallback: local scikit-learn pipeline ---
        if label is None:
            local_result = predict_sentiment(avis.commentaire)
            if local_result:
                label = local_result['label']
                confidence = local_result['score']
                model_used = local_result['model']

        if label is None:
            logger.warning("Sentiment analysis unavailable for Avis %s (no token, not enough data).", avis_id)
            avis.save(update_fields=['lang_code', 'updated_at'])
            return "No analysis method available"

        # Persist detailed record
        AnalyseSentiment.objects.update_or_create(
            avis=avis,
            defaults={
                'label': label,
                'score_brut': confidence,
                'modele_utilise': model_used,
            },
        )

        # Update Avis with frontend-compatible score
        avis.sentiment_score = SCORE_MAP[label]
        avis.save(update_fields=['sentiment_score', 'lang_code', 'updated_at'])

        return f"Sentiment analysed ({lang}) via {model_used}: {label} (score={avis.sentiment_score})"

    except Exception:
        logger.exception("Error in sentiment task for Avis %s", avis_id)
        raise
