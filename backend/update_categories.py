import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tastify_backend.settings')
import sys
sys.path.append('/app')
django.setup()

from apps.menu.models import Categorie

# Configuration
TARGET_DIR = '/app/media/categories/'
os.makedirs(TARGET_DIR, exist_ok=True)

MAPPING = {
    'Entrées': 'cat_entrees.png',
    'Plats Principaux': 'cat_plats_principaux.png',
    'Desserts': 'cat_desserts.png',
}

def update_categories():
    for cat_nom, img_name in MAPPING.items():
        try:
            cat = Categorie.objects.get(nom=cat_nom)
            cat.image = f'categories/{img_name}'
            cat.save()
            print(f"Updated image for category: {cat.nom}")
        except Categorie.DoesNotExist:
            print(f"Category {cat_nom} not found")

if __name__ == '__main__':
    update_categories()
