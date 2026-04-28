import os
import shutil
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tastify_backend.settings')
import sys
sys.path.append('/app')
django.setup()

from apps.menu.models import Plat, Categorie

# Configuration
SOURCE_DIR = '/tmp/generated_images' # I will map this in the script or use absolute paths if I can
TARGET_DIR = '/app/media/plats/'
os.makedirs(TARGET_DIR, exist_ok=True)

IMAGES = {
    'salade_cesar': 'salade_cesar.png',
    'soupe_harira': 'soupe_harira.png',
    'briouates_fromage': 'briouates_fromage.png',
    'tajine_poulet': 'tajine_poulet.png',
    'couscous_royal': 'couscous_royal.png',
    'pastilla_poulet': 'pastilla_poulet.png',
    'cornes_gazelle': 'cornes_gazelle.png',
    'chebakia': 'chebakia.png',
    'creme_caramel': 'creme_caramel.png',
    'zaalouk': 'zaalouk.png',
    'mechoui': 'mechoui.png',
    'rfissa': 'rfissa.png',
    'tanjia_marrakchia': 'tanjia_marrakchia.png',
}

# Mapping dishes to images
# Existing dishes mapping (based on previous shell output)
# (3, 'Briouates au Fromage'), (1, 'Salade César'), (2, 'Soupe Harira'), (5, 'Couscous Royal'), 
# (10, 'hgfx'), (6, 'Pastilla au Poulet'), (4, 'Tajine Poulet'), (8, 'Chebakia'), 
# (7, 'Cornes de Gazelle'), (9, 'Crème Caramel')

EXISTING_MAPPING = {
    1: 'salade_cesar.png',
    2: 'soupe_harira.png',
    3: 'briouates_fromage.png',
    4: 'tajine_poulet.png',
    5: 'couscous_royal.png',
    6: 'pastilla_poulet.png',
    7: 'cornes_gazelle.png',
    8: 'chebakia.png',
    9: 'creme_caramel.png',
    10: 'zaalouk.png',
}

NEW_DISHES = [
    {'nom': 'Mechoui', 'categorie': 'Plats Principaux', 'prix': 150, 'image': 'mechoui.png'},
    {'nom': 'Rfissa', 'categorie': 'Plats Principaux', 'prix': 85, 'image': 'rfissa.png'},
    {'nom': 'Tanjia Marrakchia', 'categorie': 'Plats Principaux', 'prix': 120, 'image': 'tanjia_marrakchia.png'},
]

def update_database():
    # 1. Rename hgfx to Zaalouk
    try:
        plat_hgfx = Plat.objects.get(id=10)
        plat_hgfx.nom = 'Zaalouk'
        plat_hgfx.save()
        print("Renamed hgfx to Zaalouk")
    except Plat.DoesNotExist:
        print("Plat with id 10 not found")

    # 2. Update existing dishes images
    for plat_id, img_name in EXISTING_MAPPING.items():
        try:
            plat = Plat.objects.get(id=plat_id)
            plat.image = f'plats/{img_name}'
            plat.save()
            print(f"Updated image for {plat.nom}")
        except Plat.DoesNotExist:
            print(f"Plat with id {plat_id} not found")

    # 3. Create new dishes
    for dish_data in NEW_DISHES:
        cat_nom = dish_data['categorie']
        try:
            cat = Categorie.objects.get(nom=cat_nom)
            plat, created = Plat.objects.get_or_create(
                nom=dish_data['nom'],
                defaults={
                    'categorie': cat,
                    'prix': dish_data['prix'],
                    'image': f"plats/{dish_data['image']}"
                }
            )
            if created:
                print(f"Created new dish: {plat.nom}")
            else:
                plat.image = f"plats/{dish_data['image']}"
                plat.save()
                print(f"Updated existing dish: {plat.nom}")
        except Categorie.DoesNotExist:
            print(f"Category {cat_nom} not found")

if __name__ == '__main__':
    update_database()
