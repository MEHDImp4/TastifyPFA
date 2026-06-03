POSITIVE_WORDS = [
    'excellent',
    'super',
    'bon',
    'delicieux',
    'délicieux',
    'parfait',
    'love',
    'loved',
    'amazing',
    'great',
]

NEGATIVE_WORDS = [
    'mauvais',
    'horrible',
    'froid',
    'lent',
    'terrible',
    'bad',
    'awful',
    'disappointed',
    'nul',
]


def predict_sentiment(commentaire):
    """
    Analyse de sentiment volontairement simple.
    Pour le jury: on compte des mots positifs et négatifs dans le commentaire.
    """
    texte = commentaire.lower()
    score_positif = 0
    score_negatif = 0

    for mot in POSITIVE_WORDS:
        if mot in texte:
            score_positif += 1

    for mot in NEGATIVE_WORDS:
        if mot in texte:
            score_negatif += 1

    if score_positif > score_negatif:
        return {'label': 'POSITIF', 'score': 0.80, 'model': 'mots-cles-simple'}

    if score_negatif > score_positif:
        return {'label': 'NEGATIF', 'score': 0.80, 'model': 'mots-cles-simple'}

    return {'label': 'NEUTRE', 'score': 0.60, 'model': 'mots-cles-simple'}
