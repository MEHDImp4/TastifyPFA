import pytest
from apps.avis.tasks import detect_language

def test_language_detection():
    # French
    assert detect_language("Le service était excellent et la nourriture délicieuse.") == 'fr'
    
    # Arabic script (Standard or Darija)
    assert detect_language("الخدمة رائعة") == 'ar'
    assert detect_language("شكرا بزاف") == 'ar'
    
    # English
    assert detect_language("The food was great and the staff was friendly.") == 'en'
