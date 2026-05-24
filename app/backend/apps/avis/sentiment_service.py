import logging
from django.apps import apps

logger = logging.getLogger(__name__)

MODEL_NAME = 'tfidf-linearsvc-local'
MIN_SAMPLES = 5


def _note_to_label(note: int) -> str:
    if note >= 4:
        return 'POSITIF'
    if note <= 2:
        return 'NEGATIF'
    return 'NEUTRE'


def predict_sentiment(text: str) -> dict | None:
    """
    Trains a TF-IDF + LinearSVC pipeline on all existing Avis records (using `note`
    as weak supervision) and predicts the sentiment for `text`.

    Returns a dict with keys 'label', 'score', 'model', or None when there are not
    enough training examples.
    """
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.svm import LinearSVC
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import LabelEncoder
        import numpy as np
    except ImportError:
        logger.warning("scikit-learn not available — local ML fallback disabled.")
        return None

    Avis = apps.get_model('avis', 'Avis')
    qs = Avis.objects.exclude(commentaire='').values_list('commentaire', 'note')
    corpus = list(qs)

    if len(corpus) < MIN_SAMPLES:
        logger.info("Not enough Avis records for local ML (%d < %d).", len(corpus), MIN_SAMPLES)
        return None

    texts, labels = zip(*[(c, _note_to_label(n)) for c, n in corpus])

    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2), sublinear_tf=True)),
        ('clf', LinearSVC(max_iter=2000, C=1.0)),
    ])

    try:
        pipeline.fit(texts, labels)
    except Exception:
        logger.exception("Local ML pipeline training failed.")
        return None

    label = pipeline.predict([text])[0]

    # LinearSVC decision_function gives a raw confidence margin — normalise to [0, 1]
    decision = pipeline.decision_function([text])[0]
    classes = pipeline.classes_  # sorted alphabetically by sklearn
    if hasattr(decision, '__len__'):
        # multi-class: take the max value
        idx = list(classes).index(label)
        raw_score = float(decision[idx])
    else:
        raw_score = float(abs(decision))

    confidence = min(1.0, max(0.0, (raw_score + 1) / 2))

    return {'label': label, 'score': round(confidence, 4), 'model': MODEL_NAME}
