import re
import unicodedata


POSITIVE_WORDS = [
    'accueillant',
    'amazing',
    'authentique',
    'bon',
    'bravo',
    'delice',
    'delicieux',
    'excellent',
    'fondant',
    'frais',
    'genial',
    'great',
    'impeccable',
    'love',
    'loved',
    'memorable',
    'parfait',
    'rapide',
    'recommande',
    'savoureux',
    'super',
    'top',
]

NEGATIVE_WORDS = [
    'attendu',
    'awful',
    'bad',
    'decu',
    'decevant',
    'disappointed',
    'froid',
    'horrible',
    'inadmissible',
    'lent',
    'mauvais',
    'nul',
    'sec',
    'terrible',
    'trop cher',
]

ARABIC_POSITIVE_WORDS = [
    'جيد',
    'جميل',
    'رائع',
    'رائعة',
    'لذيذ',
    'لذيذة',
    'ممتاز',
    'ممتازة',
    'انصح',
    'ساعود',
    'سأعود',
]

ARABIC_NEGATIVE_WORDS = [
    'بارد',
    'بطيء',
    'سيء',
    'سيئة',
    'فظيع',
    'لن اعود',
    'لم يكن',
    'مخيب',
    'انتظرنا',
]

NEGATIONS = ['pas', 'plus', 'jamais', 'not', 'never', 'no']


def _normalize(text):
    text = unicodedata.normalize('NFKD', text)
    text = ''.join(char for char in text if not unicodedata.combining(char))
    text = text.replace('’', "'").lower()
    return re.sub(r'\s+', ' ', text).strip()


def _contains_with_negation(text, word):
    pattern = re.compile(rf'\b{re.escape(word)}\b')
    matches = list(pattern.finditer(text))
    negated = 0
    for match in matches:
        window = text[max(0, match.start() - 22):match.start()]
        if any(re.search(rf'\b{negation}\b', window) for negation in NEGATIONS):
            negated += 1
    return len(matches), negated


def predict_sentiment(commentaire):
    """
    Analyse de sentiment locale multilingue.
    HuggingFace reste le moteur principal quand une clé existe; ce fallback garantit
    que la démo PFA continue même sans Internet.
    """
    texte = _normalize(commentaire)
    score_positif = 0
    score_negatif = 0

    for mot in POSITIVE_WORDS:
        matches, negated = _contains_with_negation(texte, mot)
        score_positif += max(0, matches - negated)
        score_negatif += negated

    for mot in NEGATIVE_WORDS:
        if mot in texte:
            score_negatif += 1

    for mot in ARABIC_POSITIVE_WORDS:
        if mot in commentaire:
            score_positif += 1

    for mot in ARABIC_NEGATIVE_WORDS:
        if mot in commentaire:
            score_negatif += 1

    if score_positif > score_negatif:
        confidence = min(0.95, 0.65 + (score_positif - score_negatif) * 0.08)
        return {'label': 'POSITIF', 'score': confidence, 'model': 'fallback-lexique-multilingue'}

    if score_negatif > score_positif:
        confidence = min(0.95, 0.65 + (score_negatif - score_positif) * 0.08)
        return {'label': 'NEGATIF', 'score': confidence, 'model': 'fallback-lexique-multilingue'}

    return {'label': 'NEUTRE', 'score': 0.60, 'model': 'fallback-lexique-multilingue'}
