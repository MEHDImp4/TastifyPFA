import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from apps.tables.models import Table
from apps.menu.models import Categorie, Plat
from apps.hr.models import Employe
from apps.stock.models import Ingredient, PlatIngredient
from django.db import transaction
from PIL import Image, ImageDraw

class Command(BaseCommand):
    help = 'Seed the database with users, tables, menu, and HR data.'

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                self.seed_users()
                self.seed_tables()
                self.seed_menu()
                self.seed_ingredients()
                self.seed_plat_ingredients()
                self.seed_hr()
            self.stdout.write(self.style.SUCCESS('\nAll seeding tasks completed.'))
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Error during seeding: {exc}'))

    def seed_users(self):
        User = get_user_model()
        users_data = [
            {
                'username': 'gerant_test',
                'email': 'gerant@tastify.local',
                'role': User.Role.GERANT,
                'first_name': 'Mehdi',
                'last_name': 'Tastify',
                'is_staff': True,
                'is_superuser': True
            },
            {
                'username': 'serveur_test',
                'email': 'omar.alami@tastify.local',
                'role': User.Role.SERVEUR,
                'first_name': 'Omar',
                'last_name': 'Alami',
                'is_staff': True
            },
            {
                'username': 'serveur2_test',
                'email': 'sara.bennani@tastify.local',
                'role': User.Role.SERVEUR,
                'first_name': 'Sara',
                'last_name': 'Bennani',
                'is_staff': True
            },
            {
                'username': 'serveur3_test',
                'email': 'youssef.idrissi@tastify.local',
                'role': User.Role.SERVEUR,
                'first_name': 'Youssef',
                'last_name': 'Idrissi',
                'is_staff': True
            },
            {
                'username': 'serveur4_test',
                'email': 'layla.moussa@tastify.local',
                'role': User.Role.SERVEUR,
                'first_name': 'Layla',
                'last_name': 'Moussa',
                'is_staff': True
            },
            {
                'username': 'cuisinier_test',
                'email': 'fatine.zahra@tastify.local',
                'role': User.Role.CUISINIER,
                'first_name': 'Fatine',
                'last_name': 'Zahra',
                'is_staff': True
            },
            {
                'username': 'cuisinier2_test',
                'email': 'driss.mansouri@tastify.local',
                'role': User.Role.CUISINIER,
                'first_name': 'Driss',
                'last_name': 'Mansouri',
                'is_staff': True
            },
            {
                'username': 'cuisinier3_test',
                'email': 'amina.tazi@tastify.local',
                'role': User.Role.CUISINIER,
                'first_name': 'Amina',
                'last_name': 'Tazi',
                'is_staff': True
            },
            {
                'username': 'cuisinier4_test',
                'email': 'hassan.khan@tastify.local',
                'role': User.Role.CUISINIER,
                'first_name': 'Hassan',
                'last_name': 'Khan',
                'is_staff': True
            },
            {
                'username': 'client_test',
                'email': 'karim.sadiki@gmail.com',
                'role': User.Role.CLIENT,
                'first_name': 'Karim',
                'last_name': 'Sadiki',
                'is_staff': False
            },
            {
                'username': 'client2_test',
                'email': 'salma.rami@gmail.com',
                'role': User.Role.CLIENT,
                'first_name': 'Salma',
                'last_name': 'Rami',
                'is_staff': False
            },
            {
                'username': 'client3_test',
                'email': 'amine.chraibi@gmail.com',
                'role': User.Role.CLIENT,
                'first_name': 'Amine',
                'last_name': 'Chraibi',
                'is_staff': False
            },
            {
                'username': 'client4_test',
                'email': 'fatima.alaoui@gmail.com',
                'role': User.Role.CLIENT,
                'first_name': 'Fatima',
                'last_name': 'Alaoui',
                'is_staff': False
            },
            {
                'username': 'client5_test',
                'email': 'mohammed.aziz@gmail.com',
                'role': User.Role.CLIENT,
                'first_name': 'Mohammed',
                'last_name': 'Aziz',
                'is_staff': False
            },
            {
                'username': 'client6_test',
                'email': 'noor.hassan@gmail.com',
                'role': User.Role.CLIENT,
                'first_name': 'Noor',
                'last_name': 'Hassan',
                'is_staff': False
            },
        ]

        dummy_password = 'password123'
        created = updated = 0

        for data in users_data:
            username = data.pop('username')
            user, was_created = User.objects.update_or_create(username=username, defaults=data)
            user.set_password(dummy_password)
            user.save()
            if was_created:
                created += 1
                self.stdout.write(f'Created user: {username}')
            else:
                updated += 1
                self.stdout.write(f'Updated user: {username}')

        self.stdout.write(self.style.SUCCESS(f'Users seeding complete: {created} created, {updated} updated.'))

    def seed_tables(self):
        # Table configurations: (numero, capacite)
        SEED_DATA = [
            (1, 2), (2, 2), (3, 2), (4, 2), (5, 2),
            (6, 4), (7, 4), (8, 4), (9, 4), (10, 4),
            (11, 4), (12, 4), (13, 4),
            (14, 6), (15, 6), (16, 6), (17, 6), (18, 6),
            (19, 8), (20, 8), (21, 8),
            (22, 10), (23, 10),
            (24, 2), (25, 2),
            (26, 12),
        ]
        
        # Grid settings
        cols = 5
        spacing_x = 20  # 20% width
        spacing_y = 18  # 18% height
        start_x = 10
        start_y = 10

        created = updated = 0
        for i, (numero, capacite) in enumerate(SEED_DATA):
            # Calculate grid position
            row = i // cols
            col = i % cols
            
            x = start_x + (col * spacing_x)
            y = start_y + (row * spacing_y)

            _, was_created = Table.objects.update_or_create(
                numero=numero,
                defaults={
                    'capacite': capacite,
                    'statut': Table.Statut.LIBRE,
                    'pos_x': float(x),
                    'pos_y': float(y),
                    'est_active': True,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(f'Table seeding complete: {created} created, {updated} updated.'))

    def seed_menu(self):
        SEED_DATA = [
            {
                'categorie': {
                    'nom': 'Entrées',
                    'ordre_affichage': 1,
                    'image': 'categories/entrees.png'
                },
                'plats': [
                    {'nom': 'Salade Marocaine', 'description': 'Tomates, concombres, oignons et persil frais', 'prix': '20.00', 'temps_preparation': 10, 'image': 'plats/salade_marocaine.png'},
                    {'nom': 'Zaalouk', 'description': "Caviar d'aubergines grillées aux tomates et épices", 'prix': '22.00', 'temps_preparation': 15, 'image': 'plats/zaalouk.png'},
                    {'nom': 'Briouates au Fromage', 'description': "Feuilletés croustillants au fromage (4 pièces)", 'prix': '35.00', 'temps_preparation': 12, 'image': 'plats/briouates_fromage.png'},
                    {'nom': 'Soupe Harira', 'description': 'Soupe traditionnelle marocaine riche et parfumée', 'prix': '25.00', 'temps_preparation': 15, 'image': 'plats/soupe_harira.png'},
                    {'nom': 'Salade César', 'description': 'Salade fraîche avec croûtons et sauce maison', 'prix': '45.00', 'temps_preparation': 10, 'image': 'plats/salade_cesar.png'},
                    {'nom': 'Salade de Carottes à l\'Orange', 'description': 'Carottes râpées à l’orange et cumin', 'prix': '20.00', 'temps_preparation': 10, 'image': 'plats/salade_carottes_orange.png'},
                    {'nom': 'Salade de Poivrons Grillés', 'description': 'Poivrons rouges et verts grillés à l’huile d’olive', 'prix': '22.00', 'temps_preparation': 15, 'image': 'plats/salade_poivrons.png'},
                ],
            },
            {
                'categorie': {
                    'nom': 'Plats Principaux',
                    'ordre_affichage': 2,
                    'image': 'categories/plats_principaux.png'
                },
                'plats': [
                    {'nom': 'Tajine de Poulet', 'description': 'Poulet fermier aux olives et citron confit de Marrakech', 'prix': '75.00', 'temps_preparation': 35, 'image': 'plats/tajine_poulet.png'},
                    {'nom': "Tajine d'Agneau Royal", 'description': "Agneau fondant aux pruneaux, amandes grillées et sésame", 'prix': '95.00', 'temps_preparation': 40, 'image': 'plats/tajine_agneau.png'},
                    {'nom': 'Couscous aux Sept Légumes', 'description': 'Semoule fine, légumes de saison et bouillon parfumé traditionnel', 'prix': '85.00', 'temps_preparation': 40, 'image': 'plats/couscous_royal.png'},
                    {'nom': 'Mechoui Impérial', 'description': "Épaule d'agneau rôtie lentement, parfumée aux herbes de l'Atlas", 'prix': '140.00', 'temps_preparation': 45, 'image': 'plats/mechoui.png'},
                    {'nom': 'Rfissa de la Casbah', 'description': "Poulet fermier, lentilles et crêpes msemen aux saveurs du terroir", 'prix': '80.00', 'temps_preparation': 40, 'image': 'plats/rfissa.png'},
                    {'nom': 'Tanjia Marrakchia', 'description': "Viande de boeuf fondante cuite à l'étouffée dans une jarre de terre", 'prix': '95.00', 'temps_preparation': 45, 'image': 'plats/tanjia_marrakchia.png'},
                    {'nom': 'Pastilla au Poulet', 'description': 'Feuilleté croustillant aux amandes et cannelle, héritage fassi', 'prix': '60.00', 'temps_preparation': 30, 'image': 'plats/pastilla_poulet.png'},
                    {'nom': 'Pastilla aux Fruits de Mer', 'description': 'Feuilleté épicé aux fruits de mer et vermicelles', 'prix': '70.00', 'temps_preparation': 35, 'image': 'plats/pastilla_poissons.png'},
                    {'nom': 'Tajine de Mer', 'description': "Filets de poisson frais du jour mijotés aux herbes fines", 'prix': '80.00', 'temps_preparation': 30, 'image': 'plats/tajine_poisson.png'},
                    {'nom': 'Tajine de Légumes Jardinier', 'description': "Légumes du potager mijotés aux épices douces", 'prix': '55.00', 'temps_preparation': 25, 'image': 'plats/tajine_legumes.png'},
                ],
            },
            {
                'categorie': {
                    'nom': 'Desserts',
                    'ordre_affichage': 3,
                    'image': 'categories/desserts.png'
                },
                'plats': [
                    {'nom': 'Cornes de Gazelle', 'description': "Gâteaux sablés à la pâte d'amande (3 pièces)", 'prix': '30.00', 'temps_preparation': 5, 'image': 'plats/cornes_gazelle.png'},
                    {'nom': 'Chebakia', 'description': 'Gâteaux au miel, sésame et anis (assiette)', 'prix': '25.00', 'temps_preparation': 5, 'image': 'plats/chebakia.png'},
                    {'nom': 'Briouates au Miel', 'description': 'Feuilletés aux amandes et miel (3 pièces)', 'prix': '30.00', 'temps_preparation': 8, 'image': 'plats/briouates_miel.png'},
                    {'nom': "Salade d'Oranges", 'description': "Oranges à la cannelle et eau de fleur d'oranger", 'prix': '20.00', 'temps_preparation': 10, 'image': 'plats/salade_oranges.png'},
                    {'nom': 'Msemen au Miel', 'description': 'Crêpes feuilletées servies avec du miel', 'prix': '20.00', 'temps_preparation': 10, 'image': 'plats/msemen_miel.png'},
                    {'nom': 'Ghriba aux Amandes', 'description': "Biscuits fondants à la poudre d'amandes et sucre glace", 'prix': '25.00', 'temps_preparation': 5, 'image': 'plats/ghriba_amandes.png'},
                    {'nom': 'Ghriba aux Noix', 'description': "Biscuits croquants à la poudre de noix et sucre glace", 'prix': '25.00', 'temps_preparation': 5, 'image': 'plats/ghriba_noix.png'},
                ],
            },
            {
                'categorie': {
                    'nom': 'Boissons',
                    'ordre_affichage': 4,
                    'image': 'categories/boissons.png'
                },
                'plats': [
                    {'nom': 'Thé à la Menthe', 'description': 'Thé vert traditionnel à la menthe fraîche', 'prix': '15.00', 'temps_preparation': 5, 'image': 'plats/the_menthe.png'},
                    {'nom': "Jus d'Orange Frais", 'description': 'Oranges pressées à la demande', 'prix': '20.00', 'temps_preparation': 5, 'image': 'plats/jus_orange.png'},
                    {'nom': 'Lben', 'description': 'Lait fermenté traditionnel frais', 'prix': '10.00', 'temps_preparation': 2, 'image': 'plats/lben.png'},
                    {'nom': 'Café Noir/Cassé', 'description': 'Café fraîchement moulu', 'prix': '15.00', 'temps_preparation': 5, 'image': 'plats/cafe.png'},
                    {'nom': 'Café au Lait', 'description': 'Café mélangé avec du lait chaud', 'prix': '18.00', 'temps_preparation': 5, 'image': 'plats/cafe_lait.png'},
                    {'nom': 'Café à la Menthe', 'description': 'Café infusé avec de la menthe fraîche', 'prix': '18.00', 'temps_preparation': 5, 'image': 'plats/cafe_menthe.png'},
                    {'nom': 'Café aux Épices', 'description': 'Café aromatisé avec de la cannelle et du gingembre', 'prix': '18.00', 'temps_preparation': 5, 'image': 'plats/cafe_epices.png'},
                ],
            },
        ]

        total_categories = total_plats = 0
        image_paths = []
        for entry in SEED_DATA:
            cat_info = entry['categorie']
            if cat_info.get('image'):
                image_paths.append(cat_info['image'])
            cat, was_created = Categorie.objects.update_or_create(
                nom=cat_info['nom'],
                defaults={
                    'ordre_affichage': cat_info['ordre_affichage'],
                    'image': cat_info.get('image'),
                },
            )
            if was_created:
                total_categories += 1
                self.stdout.write(f'  Created category: {cat.nom}')
            else:
                self.stdout.write(f'  Updated category: {cat.nom}')

            for plat_data in entry['plats']:
                if plat_data.get('image'):
                    image_paths.append(plat_data['image'])
                plat, was_created = Plat.objects.update_or_create(
                    nom=plat_data['nom'],
                    defaults={
                        'categorie': cat,
                        'description': plat_data.get('description', ''),
                        'prix': plat_data['prix'],
                        'temps_preparation': plat_data.get('temps_preparation', 15),
                        'image': plat_data.get('image'),
                    },
                )
                if was_created:
                    total_plats += 1
                    self.stdout.write(f'    Created dish: {plat.nom}')
                else:
                    self.stdout.write(f'    Updated dish: {plat.nom}')

        created_images = self.ensure_seed_media(image_paths)
        if created_images:
            self.stdout.write(self.style.SUCCESS(f'Created {created_images} missing seed media file(s).'))

        self.stdout.write(self.style.SUCCESS(f'\nSeeding complete: {total_categories} new categories, {total_plats} new dishes.'))

    def ensure_seed_media(self, image_paths):
        import urllib.request
        created = 0
        media_downloads = os.environ.get('SEED_MEDIA_DOWNLOADS')
        should_download_media = (
            media_downloads.lower() in {'1', 'true', 'yes', 'on'}
            if media_downloads is not None
            else os.environ.get('CI', '').lower() not in {'1', 'true', 'yes', 'on'}
        )
        
        # High quality royalty free images from Unsplash matching each Moroccan dish/category
        url_map = {
            'categories/entrees.png': 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=900&auto=format&fit=crop',
            'categories/plats_principaux.png': 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?q=80&w=900&auto=format&fit=crop',
            'categories/desserts.png': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=900&auto=format&fit=crop',
            'categories/boissons.png': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=900&auto=format&fit=crop',
            'plats/salade_marocaine.png': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=900&auto=format&fit=crop',
            'plats/zaalouk.png': 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=900&auto=format&fit=crop',
            'plats/briouates_fromage.png': 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?q=80&w=900&auto=format&fit=crop',
            'plats/soupe_harira.png': 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=900&auto=format&fit=crop',
            'plats/salade_cesar.png': 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=900&auto=format&fit=crop',
            'plats/salade_carottes_orange.png': 'https://images.unsplash.com/photo-1447078806655-409295609843?q=80&w=900&auto=format&fit=crop',
            'plats/salade_poivrons.png': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=900&auto=format&fit=crop',
            'plats/tajine_poulet.png': 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?q=80&w=900&auto=format&fit=crop',
            'plats/tajine_agneau.png': 'https://images.unsplash.com/photo-1511910849309-0dcdb8395896?q=80&w=900&auto=format&fit=crop',
            'plats/couscous_royal.png': 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=900&auto=format&fit=crop',
            'plats/mechoui.png': 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=900&auto=format&fit=crop',
            'plats/rfissa.png': 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=900&auto=format&fit=crop',
            'plats/tanjia_marrakchia.png': 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=900&auto=format&fit=crop',
            'plats/pastilla_poulet.png': 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?q=80&w=900&auto=format&fit=crop',
            'plats/pastilla_poissons.png': 'https://images.unsplash.com/photo-1534482421-64566f976cfa?q=80&w=900&auto=format&fit=crop',
            'plats/tajine_poisson.png': 'https://images.unsplash.com/photo-1534482421-64566f976cfa?q=80&w=900&auto=format&fit=crop',
            'plats/tajine_legumes.png': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=900&auto=format&fit=crop',
            'plats/cornes_gazelle.png': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=900&auto=format&fit=crop',
            'plats/chebakia.png': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=900&auto=format&fit=crop',
            'plats/briouates_miel.png': 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?q=80&w=900&auto=format&fit=crop',
            'plats/salade_oranges.png': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=900&auto=format&fit=crop',
            'plats/msemen_miel.png': 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=900&auto=format&fit=crop',
            'plats/ghriba_amandes.png': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=900&auto=format&fit=crop',
            'plats/ghriba_noix.png': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=900&auto=format&fit=crop',
            'plats/the_menthe.png': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=900&auto=format&fit=crop',
            'plats/jus_orange.png': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=900&auto=format&fit=crop',
            'plats/lben.png': 'https://images.unsplash.com/photo-1528750955903-2988e89caf5d?q=80&w=900&auto=format&fit=crop',
            'plats/cafe.png': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=900&auto=format&fit=crop',
            'plats/cafe_lait.png': 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=900&auto=format&fit=crop',
            'plats/cafe_menthe.png': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=900&auto=format&fit=crop',
            'plats/cafe_epices.png': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=900&auto=format&fit=crop',
        }

        colors = [
            ((121, 84, 45), (242, 228, 208)),
            ((28, 83, 75), (218, 240, 232)),
            ((126, 54, 45), (246, 221, 214)),
            ((64, 75, 112), (224, 229, 246)),
        ]

        for index, image_path in enumerate(dict.fromkeys(image_paths)):
            target = settings.MEDIA_ROOT / image_path
            if target.exists():
                continue

            target.parent.mkdir(parents=True, exist_ok=True)
            
            downloaded = False
            url = url_map.get(image_path)
            if should_download_media and url:
                try:
                    req = urllib.request.Request(
                        url,
                        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
                    )
                    with urllib.request.urlopen(req, timeout=10) as response:
                        with open(target, 'wb') as f:
                            f.write(response.read())
                    downloaded = True
                    created += 1
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  Failed to download image {image_path}: {e}. Falling back to placeholder."))
            
            if not downloaded:
                primary, secondary = colors[index % len(colors)]
                image = Image.new('RGB', (900, 600), primary)
                draw = ImageDraw.Draw(image)
                draw.rectangle((0, 400, 900, 600), fill=secondary)
                draw.ellipse((620, 70, 820, 270), fill=secondary)
                draw.rectangle((90, 110, 550, 150), fill=secondary)
                draw.rectangle((90, 180, 430, 215), fill=secondary)
                image.save(target, format='PNG')
                created += 1

        return created

    def seed_ingredients(self):
        SEED_DATA = [
            {'nom': 'Tomate', 'unite_mesure': 'g', 'stock_actuel': 5000, 'seuil_alerte': 1000},
            {'nom': 'Concombre', 'unite_mesure': 'g', 'stock_actuel': 3000, 'seuil_alerte': 500},
            {'nom': 'Oignon', 'unite_mesure': 'g', 'stock_actuel': 4000, 'seuil_alerte': 800},
            {'nom': 'Ail', 'unite_mesure': 'g', 'stock_actuel': 500, 'seuil_alerte': 100},
            {'nom': 'Persil frais', 'unite_mesure': 'g', 'stock_actuel': 500, 'seuil_alerte': 100},
            {'nom': 'Menthe fraîche', 'unite_mesure': 'g', 'stock_actuel': 400, 'seuil_alerte': 100},
            {'nom': 'Laitue', 'unite_mesure': 'g', 'stock_actuel': 2000, 'seuil_alerte': 500},
            {'nom': 'Aubergine', 'unite_mesure': 'g', 'stock_actuel': 2500, 'seuil_alerte': 500},
            {'nom': 'Poivron rouge', 'unite_mesure': 'g', 'stock_actuel': 1500, 'seuil_alerte': 300},
            {'nom': 'Poivron vert', 'unite_mesure': 'g', 'stock_actuel': 1500, 'seuil_alerte': 300},
            {'nom': 'Courgette', 'unite_mesure': 'g', 'stock_actuel': 2000, 'seuil_alerte': 400},
            {'nom': 'Carotte', 'unite_mesure': 'g', 'stock_actuel': 3000, 'seuil_alerte': 600},
            {'nom': 'Citron', 'unite_mesure': 'pcs', 'stock_actuel': 100, 'seuil_alerte': 20},
            {'nom': 'Orange', 'unite_mesure': 'pcs', 'stock_actuel': 80, 'seuil_alerte': 15},
            {'nom': 'Citron confit', 'unite_mesure': 'g', 'stock_actuel': 800, 'seuil_alerte': 200},
            {'nom': 'Olives vertes', 'unite_mesure': 'g', 'stock_actuel': 2000, 'seuil_alerte': 400},
            
            {'nom': 'Poulet fermier', 'unite_mesure': 'g', 'stock_actuel': 10000, 'seuil_alerte': 2000},
            {'nom': 'Agneau', 'unite_mesure': 'g', 'stock_actuel': 8000, 'seuil_alerte': 1500},
            {'nom': 'Boeuf', 'unite_mesure': 'g', 'stock_actuel': 7000, 'seuil_alerte': 1500},
            {'nom': 'Poisson blanc', 'unite_mesure': 'g', 'stock_actuel': 5000, 'seuil_alerte': 1000},
            {'nom': 'Crevettes', 'unite_mesure': 'g', 'stock_actuel': 2000, 'seuil_alerte': 500},
            
            {'nom': 'Semoule fine', 'unite_mesure': 'g', 'stock_actuel': 10000, 'seuil_alerte': 2000},
            {'nom': 'Lentilles vertes', 'unite_mesure': 'g', 'stock_actuel': 3000, 'seuil_alerte': 600},
            {'nom': 'Pois chiches', 'unite_mesure': 'g', 'stock_actuel': 3000, 'seuil_alerte': 600},
            {'nom': 'Riz', 'unite_mesure': 'g', 'stock_actuel': 5000, 'seuil_alerte': 1000},
            
            {'nom': 'Huile d\'olive', 'unite_mesure': 'ml', 'stock_actuel': 3000, 'seuil_alerte': 500},
            {'nom': 'Beurre', 'unite_mesure': 'g', 'stock_actuel': 2000, 'seuil_alerte': 400},
            {'nom': 'Lait', 'unite_mesure': 'ml', 'stock_actuel': 2000, 'seuil_alerte': 500},            {'nom': 'Sucre', 'unite_mesure': 'g', 'stock_actuel': 2000, 'seuil_alerte': 400},            {'nom': 'Fromage blanc', 'unite_mesure': 'g', 'stock_actuel': 1500, 'seuil_alerte': 300},
            
            {'nom': 'Gingembre', 'unite_mesure': 'g', 'stock_actuel': 500, 'seuil_alerte': 100},
            {'nom': 'Curcuma', 'unite_mesure': 'g', 'stock_actuel': 300, 'seuil_alerte': 50},
            {'nom': 'Cumin', 'unite_mesure': 'g', 'stock_actuel': 400, 'seuil_alerte': 80},
            {'nom': 'Cannelle', 'unite_mesure': 'g', 'stock_actuel': 200, 'seuil_alerte': 50},
            {'nom': 'Safran', 'unite_mesure': 'g', 'stock_actuel': 50, 'seuil_alerte': 10},
            {'nom': 'Paprika', 'unite_mesure': 'g', 'stock_actuel': 300, 'seuil_alerte': 60},
            {'nom': 'Poivre noir', 'unite_mesure': 'g', 'stock_actuel': 200, 'seuil_alerte': 40},
            {'nom': 'Sel fin', 'unite_mesure': 'g', 'stock_actuel': 2000, 'seuil_alerte': 300},
            
            {'nom': 'Amandes', 'unite_mesure': 'g', 'stock_actuel': 1500, 'seuil_alerte': 300},
            {'nom': 'Noix', 'unite_mesure': 'g', 'stock_actuel': 1000, 'seuil_alerte': 200},
            {'nom': 'Pignons de pin', 'unite_mesure': 'g', 'stock_actuel': 800, 'seuil_alerte': 200},
            {'nom': 'Pruneaux', 'unite_mesure': 'g', 'stock_actuel': 1000, 'seuil_alerte': 200},
            {'nom': 'Miel', 'unite_mesure': 'g', 'stock_actuel': 2000, 'seuil_alerte': 400},
            
            {'nom': 'Feuille de brick', 'unite_mesure': 'pcs', 'stock_actuel': 100, 'seuil_alerte': 20},
            {'nom': 'Feuille de pâte phyllo', 'unite_mesure': 'g', 'stock_actuel': 1000, 'seuil_alerte': 200},
            {'nom': 'Œuf', 'unite_mesure': 'pcs', 'stock_actuel': 200, 'seuil_alerte': 50},
            {'nom': 'Farine', 'unite_mesure': 'g', 'stock_actuel': 5000, 'seuil_alerte': 1000},
            
            {'nom': 'Thé vert', 'unite_mesure': 'g', 'stock_actuel': 500, 'seuil_alerte': 100},
            {'nom': 'Café moulu', 'unite_mesure': 'g', 'stock_actuel': 800, 'seuil_alerte': 150},
            {'nom': 'Sésame', 'unite_mesure': 'g', 'stock_actuel': 500, 'seuil_alerte': 100},
            {'nom': 'Anis', 'unite_mesure': 'g', 'stock_actuel': 200, 'seuil_alerte': 50},
            {'nom': 'Merguez', 'unite_mesure': 'g', 'stock_actuel': 2000, 'seuil_alerte': 400},
        ]

        created = updated = 0
        for data in SEED_DATA:
            _, was_created = Ingredient.objects.update_or_create(
                nom=data['nom'],
                defaults={
                    'unite_mesure': data['unite_mesure'],
                    'stock_actuel': data['stock_actuel'],
                    'seuil_alerte': data['seuil_alerte'],
                    'est_active': True,
                },
            )
            if was_created:
                created += 1
                self.stdout.write(f'  Created ingredient: {data["nom"]}')
            else:
                updated += 1
                self.stdout.write(f'  Updated ingredient: {data["nom"]}')

        self.stdout.write(self.style.SUCCESS(f'Ingredient seeding complete: {created} created, {updated} updated.'))

    def seed_plat_ingredients(self):
        SEED_DATA = {
            'Salade Marocaine': [
                ('Tomate', 250),
                ('Concombre', 200),
                ('Oignon', 80),
                ('Persil frais', 40),
                ('Huile d\'olive', 20),
                ('Sel fin', 2),
            ],
            'Zaalouk': [
                ('Aubergine', 400),
                ('Tomate', 300),
                ('Ail', 15),
                ('Gingembre', 8),
                ('Cumin', 2),
                ('Huile d\'olive', 25),
                ('Persil frais', 20),
                ('Sel fin', 2),
            ],
            'Briouates au Fromage': [
                ('Feuille de brick', 4),
                ('Fromage blanc', 120),
                ('Œuf', 2),
                ('Persil frais', 15),
                ('Huile d\'olive', 60),
                ('Sel fin', 1),
            ],
            'Soupe Harira': [
                ('Boeuf', 50),
                ('Pois chiches', 100),
                ('Lentilles vertes', 100),
                ('Tomate', 150),
                ('Oignon', 100),
                ('Gingembre', 10),
                ('Curcuma', 3),
                ('Sel fin', 2),
                ('Huile d\'olive', 30),
            ],
            'Lben': [
                ('Lait', 250),
            ],
            'Salade de Carottes à l\'Orange': [
                ('Carotte', 300),
                ('Orange', 2),
                ('Cumin', 2),
                ('Huile d\'olive', 20),
                ('Sel fin', 1),
            ],
            'Salade de Poivrons Grillés': [
                ('Poivron rouge', 200),
                ('Poivron vert', 150),
                ('Ail', 10),
                ('Huile d\'olive', 25),
                ('Sel fin', 1),
                ('Citron', 0.5),
            ],
            'Salade César': [
                ('Laitue', 250),
                ('Fromage blanc', 60),
                ('Œuf', 2),
                ('Huile d\'olive', 25),
                ('Citron', 1),
                ('Sel fin', 1),
            ],
            'Tajine de Poulet': [
                ('Poulet fermier', 450),
                ('Oignon', 180),
                ('Citron confit', 80),
                ('Olives vertes', 120),
                ('Gingembre', 12),
                ('Curcuma', 3),
                ('Sel fin', 3),
                ('Huile d\'olive', 40),
            ],
            'Tajine d\'Agneau Royal': [
                ('Agneau', 500),
                ('Oignon', 200),
                ('Pruneaux', 120),
                ('Amandes', 60),
                ('Gingembre', 15),
                ('Cannelle', 3),
                ('Sel fin', 3),
                ('Huile d\'olive', 40),
            ],
            'Couscous aux Sept Légumes': [
                ('Semoule fine', 350),
                ('Poulet fermier', 250),
                ('Merguez', 180),
                ('Carotte', 120),
                ('Oignon', 100),
                ('Courgette', 80),
                ('Pois chiches', 80),
                ('Sel fin', 3),
                ('Huile d\'olive', 35),
            ],
            'Mechoui Impérial': [
                ('Agneau', 600),
                ('Cumin', 8),
                ('Paprika', 3),
                ('Gingembre', 10),
                ('Sel fin', 4),
                ('Huile d\'olive', 30),
            ],
            'Rfissa de la Casbah': [
                ('Poulet fermier', 450),
                ('Lentilles vertes', 180),
                ('Farine', 200),
                ('Œuf', 3),
                ('Oignon', 120),
                ('Gingembre', 12),
                ('Curcuma', 2),
                ('Sel fin', 2),
                ('Huile d\'olive', 40),
            ],
            'Tanjia Marrakchia': [
                ('Boeuf', 550),
                ('Oignon', 180),
                ('Gingembre', 18),
                ('Ail', 15),
                ('Cumin', 3),
                ('Paprika', 2),
                ('Sel fin', 3),
                ('Huile d\'olive', 40),
            ],
            'Pastilla au Poulet': [
                ('Feuille de pâte phyllo', 250),
                ('Poulet fermier', 350),
                ('Oignon', 100),
                ('Œuf', 3),
                ('Amandes', 70),
                ('Persil frais', 20),
                ('Cannelle', 4),
                ('Miel', 40),
                ('Huile d\'olive', 30),
            ],
            'Pastilla aux Fruits de Mer': [
                ('Feuille de pâte phyllo', 250),
                ('Poisson blanc', 280),
                ('Crevettes', 120),
                ('Oignon', 80),
                ('Œuf', 3),
                ('Gingembre', 8),
                ('Cumin', 3),
                ('Persil frais', 15),
                ('Huile d\'olive', 25),
            ],
            'Tajine de Mer': [
                ('Poisson blanc', 450),
                ('Tomate', 200),
                ('Oignon', 130),
                ('Poivron rouge', 100),
                ('Citron', 1),
                ('Gingembre', 12),
                ('Curcuma', 3),
                ('Persil frais', 15),
                ('Sel fin', 2),
                ('Huile d\'olive', 35),
            ],
            'Tajine de Légumes Jardinier': [
                ('Carotte', 180),
                ('Courgette', 180),
                ('Pois chiches', 120),
                ('Tomate', 150),
                ('Oignon', 120),
                ('Poivron rouge', 80),
                ('Gingembre', 10),
                ('Cumin', 2),
                ('Sel fin', 2),
                ('Huile d\'olive', 30),
            ],
            'Thé à la Menthe': [
                ('Thé vert', 8),
                ('Menthe fraîche', 30),
                ('Miel', 10),
                ('Sucre', 5),
            ],
            'Jus d\'Orange Frais': [
                ('Orange', 5),
                ('Sucre', 5),
            ],
            'Café Noir/Cassé': [
                ('Café moulu', 12),
                ('Sucre', 5),
            ],
            'Café au Lait': [
                ('Café moulu', 10),
                ('Lait', 180),
                ('Sucre', 5),
            ],
            'Café à la Menthe': [
                ('Café moulu', 10),
                ('Menthe fraîche', 15),
                ('Lait', 150),
                ('Sucre', 5),
            ],
            'Café aux Épices': [
                ('Café moulu', 10),
                ('Cannelle', 2),
                ('Gingembre', 3),
                ('Lait', 150),
                ('Sucre', 5),
            ],
            'Cornes de Gazelle': [
                ('Feuille de pâte phyllo', 120),
                ('Amandes', 100),
                ('Miel', 50),
                ('Cannelle', 3),
                ('Œuf', 2),
                ('Beurre', 30),
            ],
            'Chebakia': [
                ('Farine', 250),
                ('Miel', 120),
                ('Sésame', 80),
                ('Anis', 8),
                ('Œuf', 2),
                ('Huile d\'olive', 40),
            ],
            'Briouates au Miel': [
                ('Feuille de brick', 6),
                ('Amandes', 80),
                ('Miel', 60),
                ('Cannelle', 3),
                ('Œuf', 2),
                ('Beurre', 40),
            ],
            'Salade d\'Oranges': [
                ('Orange', 5),
                ('Cannelle', 2),
                ('Miel', 20),
            ],
            'Msemen au Miel': [
                ('Farine', 200),
                ('Beurre', 80),
                ('Miel', 60),
                ('Sucre', 10),
            ],
            'Ghriba aux Amandes': [
                ('Amandes', 180),
                ('Farine', 120),
                ('Œuf', 2),
                ('Beurre', 70),
                ('Sucre', 15),
            ],
            'Ghriba aux Noix': [
                ('Noix', 180),
                ('Farine', 120),
                ('Œuf', 2),
                ('Beurre', 70),
                ('Sucre', 15),
            ],
        }

        created = updated = 0
        for plat_name, ingredients_data in SEED_DATA.items():
            try:
                plat = Plat.objects.get(nom=plat_name)
                for ingredient_name, quantite in ingredients_data:
                    try:
                        ingredient = Ingredient.objects.get(nom=ingredient_name)
                        _, was_created = PlatIngredient.objects.update_or_create(
                            plat=plat,
                            ingredient=ingredient,
                            defaults={'quantite_requise': quantite},
                        )
                        if was_created:
                            created += 1
                        else:
                            updated += 1
                    except Ingredient.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f'    Ingredient not found: {ingredient_name} for {plat_name}'))
            except Plat.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Dish not found: {plat_name}'))

        self.stdout.write(self.style.SUCCESS(f'Plat-Ingredient seeding complete: {created} created, {updated} updated.'))

    def seed_hr(self):
        User = get_user_model()
        staff_users = User.objects.exclude(role=User.Role.CLIENT)
        
        positions = {
            User.Role.GERANT: ('Directeur de Restaurant', 12000.00),
            User.Role.SERVEUR: ('Chef de Rang', 4500.00),
            User.Role.CUISINIER: ('Chef de Partie', 5500.00),
        }

        addresses = [
            '123 Avenue Mohammed V, Casablanca',
            '45 Rue Fez, Marrakech',
            '67 Boulevard Hassan II, Rabat',
            '89 Avenue Lalla Yacout, Fez',
            '12 Rue Allal Ben Abdellah, Tangier',
            '34 Avenue Moulay Youssef, Meknès',
            '56 Rue Ibn Battuta, Agadir',
        ]

        created = updated = 0
        for idx, user in enumerate(staff_users):
            pos_name, base_salary = positions.get(user.role, ('Employé', 4000.00))
            
            cin = f"AB{100000 + user.id}"
            phone = f"06{str(user.id).zfill(8)}"
            address = addresses[idx % len(addresses)]
            
            _, was_created = Employe.objects.update_or_create(
                user=user,
                defaults={
                    'poste': pos_name,
                    'salaire': base_salary,
                    'date_embauche': timezone.now().date(),
                    'telephone': phone,
                    'adresse': address,
                    'cin': cin,
                }
            )
            if was_created:
                created += 1
            else:
                updated += 1
        
        self.stdout.write(self.style.SUCCESS(f'HR seeding complete: {created} created, {updated} updated.'))
