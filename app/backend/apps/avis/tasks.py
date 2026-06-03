import logging
import re

import requests
from celery import shared_task
from decouple import config
from django.apps import apps

from .sentiment_service import predict_sentiment

logger = logging.getLogger(__name__)

MODEL_MAP = {
    'multilingual': 'nlptown/bert-base-multilingual-uncased-sentiment',
    'arabic': 'moussaKam/MARBERT-sentiment',
}
ARABIC_FALLBACK_MODEL = 'nlptown/bert-base-multilingual-uncased-sentiment'

SCORE_MAP = {
    'POSITIF': 15,
    'NEUTRE': 0,
    'NEGATIF': -15,
}


def get_hf_api_token():
    """Lit le token HuggingFace si le projet en a un dans le fichier .env."""
    raw_token = config('HUGGINGFACE_API_TOKEN', default='').strip()
    if raw_token.lower().startswith('bearer '):
        return raw_token[7:].strip()
    return raw_token


def query_hf_api(text, model_name):
    """
    Appelle l'API HuggingFace.
    C'est la méthode principale demandée pour analyser les avis clients.
    """
    token = get_hf_api_token()
    if not token:
        return None

    url = f'https://router.huggingface.co/hf-inference/models/{model_name}'
    headers = {'Authorization': f'Bearer {token}'}

    try:
        response = requests.post(url, headers=headers, json={'inputs': text}, timeout=10)
    except requests.exceptions.RequestException:
        logger.exception('Impossible de contacter HuggingFace.')
        return None

    if response.status_code == 503:
        logger.warning('Le modele HuggingFace est en chargement.')
        return None

    if response.status_code != 200:
        logger.warning('HuggingFace a retourne le statut %s.', response.status_code)
        return None

    return response.json()


def detect_language(text):
    """Détection très simple: arabe si caractères arabes, sinon anglais/français par défaut."""
    if re.search(r'[\u0600-\u06FF]', text):
        return 'ar'
    return 'en'


def _hf_output_to_label(output):
    """Convertit la réponse HuggingFace en POSITIF, NEUTRE ou NEGATIF."""
    try:
        results = output[0] if isinstance(output[0], list) else output
        best = max(results, key=lambda item: item['score'])
        raw_label = best['label'].upper()
        confidence = float(best['score'])

        if 'POSITIVE' in raw_label or 'LABEL_2' in raw_label:
            return 'POSITIF', confidence
        if 'NEGATIVE' in raw_label or 'LABEL_0' in raw_label:
            return 'NEGATIF', confidence
        if 'NEUTRAL' in raw_label or 'LABEL_1' in raw_label:
            return 'NEUTRE', confidence

        # Certains modèles renvoient "1 star", "5 stars", etc.
        stars = int(raw_label.split()[0])
        if stars >= 4:
            return 'POSITIF', confidence
        if stars <= 2:
            return 'NEGATIF', confidence
        return 'NEUTRE', confidence
    except Exception:
        logger.exception('Format HuggingFace non reconnu.')
        return None


@shared_task(name='apps.avis.tasks.analyze_review_sentiment')
def analyze_review_sentiment(avis_id):
    """
    Analyse un avis client.
    Étape 1: HuggingFace analyse le commentaire avec un modèle de sentiment.
    Étape 2: le fallback local est utilisé seulement si HuggingFace n'est pas disponible.
    """
    Avis = apps.get_model('avis', 'Avis')
    AnalyseSentiment = apps.get_model('avis', 'AnalyseSentiment')

    avis = Avis.objects.get(id=avis_id)
    if not avis.commentaire:
        return 'No commentary'

    lang = detect_language(avis.commentaire)
    label = None
    confidence = 0.0
    model_used = None

    # HuggingFace est la méthode principale du projet.
    if get_hf_api_token():
        model_name = MODEL_MAP['arabic'] if lang == 'ar' else MODEL_MAP['multilingual']
        output = query_hf_api(avis.commentaire[:512], model_name)

        # Si le modèle arabe ne répond pas, on essaie le modèle multilingue.
        if output is None and lang == 'ar':
            model_name = ARABIC_FALLBACK_MODEL
            output = query_hf_api(avis.commentaire[:512], model_name)

        parsed = _hf_output_to_label(output) if output else None
        if parsed:
            label, confidence = parsed
            model_used = model_name

    # Secours: utile en local si le token HuggingFace manque ou si l'API est indisponible.
    if label is None:
        local_result = predict_sentiment(avis.commentaire)
        label = local_result['label']
        confidence = local_result['score']
        model_used = local_result['model']

    AnalyseSentiment.objects.update_or_create(
        avis=avis,
        defaults={
            'label': label,
            'score_brut': confidence,
            'modele_utilise': model_used,
        },
    )

    avis.lang_code = lang
    avis.sentiment_score = SCORE_MAP[label]
    avis.save(update_fields=['lang_code', 'sentiment_score', 'updated_at'])

    return f'Sentiment analysed ({lang}) via {model_used}: {label} (score={avis.sentiment_score})'
