from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.tables.models import Table
from apps.menu.models import Categorie, Plat
from apps.hr.models import Employe
from apps.stock.models import Ingredient, PlatIngredient
from django.db import transaction

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
        created = updated = 0
        for numero, capacite in SEED_DATA:
            _, was_created = Table.objects.update_or_create(
                numero=numero,
                defaults={
                    'capacite': capacite,
                    'statut': Table.Statut.LIBRE,
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
                    {'nom': 'Salade Marocaine', 'description': 'Tomates, concombres, oignons et persil frais', 'prix': '6.00', 'temps_preparation': 10, 'image': 'plats/salade_marocaine.png'},
                    {'nom': 'Zaalouk', 'description': "Caviar d'aubergines grillées aux tomates et épices", 'prix': '7.50', 'temps_preparation': 15, 'image': 'plats/zaalouk.png'},
                    {'nom': 'Briouates au Fromage', 'description': "Feuilletés croustillants au fromage (4 pièces)", 'prix': '9.00', 'temps_preparation': 12, 'image': 'plats/briouates_fromage.png'},
                    {'nom': 'Soupe Harira', 'description': 'Soupe traditionnelle marocaine riche et parfumée', 'prix': '6.50', 'temps_preparation': 15, 'image': 'plats/soupe_harira.png'},
                    {'nom': 'Salade César', 'description': 'Salade fraîche avec croûtons et sauce maison', 'prix': '8.50', 'temps_preparation': 10, 'image': 'plats/salade_cesar.png'},
                    {'nom': 'Salade de Carottes à l’Orange', 'description': 'Carottes râpées à l’orange et cumin', 'prix': '6.00', 'temps_preparation': 10, 'image': 'plats/salade_carottes_orange.png'},
                    {'nom': 'Salade de Poivrons Grillés', 'description': 'Poivrons rouges et verts grillés à l’huile d’olive', 'prix': '7.00', 'temps_preparation': 15, 'image': 'plats/salade_poivrons.png'},
                ],
            },
            {
                'categorie': {
                    'nom': 'Plats Principaux',
                    'ordre_affichage': 2,
                    'image': 'categories/plats_principaux.png'
                },
                'plats': [
                    {'nom': 'Tajine Poulet', 'description': 'Poulet aux olives et citron confit', 'prix': '22.00', 'temps_preparation': 35, 'image': 'plats/tajine_poulet.png'},
                    {'nom': 'Tajine Agneau', 'description': "Agneau aux pruneaux et amandes grillées", 'prix': '26.00', 'temps_preparation': 40, 'image': 'plats/tajine_agneau.png'},
                    {'nom': 'Couscous Royal', 'description': 'Semoule fine, sept légumes, poulet et merguez', 'prix': '25.00', 'temps_preparation': 40, 'image': 'plats/couscous_royal.png'},
                    {'nom': 'Mechoui', 'description': "Épaule d'agneau rôtie lentement aux épices", 'prix': '30.00', 'temps_preparation': 45, 'image': 'plats/mechoui.png'},
                    {'nom': 'Rfissa', 'description': "Poulet fermier, lentilles et crêpes msemen émiettées", 'prix': '24.00', 'temps_preparation': 40, 'image': 'plats/rfissa.png'},
                    {'nom': 'Tanjia Marrakchia', 'description': "Viande de boeuf fondante cuite à l'étouffée", 'prix': '28.00', 'temps_preparation': 45, 'image': 'plats/tanjia_marrakchia.png'},
                    {'nom': 'Pastilla au Poulet', 'description': 'Feuilleté sucré-salé traditionnel à la cannelle', 'prix': '18.00', 'temps_preparation': 30, 'image': 'plats/pastilla_poulet.png'},
                    {'nom': 'Pastilla aux Poissons', 'description': 'Feuilleté épicé aux fruits de mer et vermicelles', 'prix': '20.00', 'temps_preparation': 35, 'image': 'plats/pastilla_poissons.png'},
                    {'nom': 'Tajine de Poisson', 'description': "Filets de poisson cuits avec légumes et épices", 'prix': '24.00', 'temps_preparation': 30, 'image': 'plats/tajine_poisson.png'},
                    {'nom': 'Tajine de Légumes', 'description': "Légumes de saison mijotés aux épices", 'prix': '18.00', 'temps_preparation': 25, 'image': 'plats/tajine_legumes.png'},
                ],
            },
            {
                'categorie': {
                    'nom': 'Desserts',
                    'ordre_affichage': 3,
                    'image': 'categories/desserts.png'
                },
                'plats': [
                    {'nom': 'Cornes de Gazelle', 'description': "Gâteaux sablés à la pâte d'amande (3 pièces)", 'prix': '6.00', 'temps_preparation': 5, 'image': 'plats/cornes_gazelle.png'},
                    {'nom': 'Chebakia', 'description': 'Gâteaux au miel, sésame et anis (assiette)', 'prix': '5.00', 'temps_preparation': 5, 'image': 'plats/chebakia.png'},
                    {'nom': 'Briouates au Miel', 'description': 'Feuilletés aux amandes et miel (3 pièces)', 'prix': '7.00', 'temps_preparation': 8, 'image': 'plats/briouates_miel.png'},
                    {'nom': "Salade d'Oranges", 'description': "Oranges à la cannelle et eau de fleur d'oranger", 'prix': '6.00', 'temps_preparation': 10, 'image': 'plats/salade_oranges.png'},
                    {'nom': 'Msemen au Miel', 'description': 'Crêpes feuilletées servies avec du miel', 'prix': '5.00', 'temps_preparation': 10, 'image': 'plats/msemen_miel.png'},
                    {'nom': 'Ghriba aux Amandes', 'description': "Biscuits fondants à la poudre d'amandes et sucre glace", 'prix': '6.00', 'temps_preparation': 5, 'image': 'plats/ghriba_amandes.png'},
                    {'nom': 'Ghriba aux Noix', 'description': "Biscuits croquants à la poudre de noix et sucre glace", 'prix': '6.00', 'temps_preparation': 5, 'image': 'plats/ghriba_noix.png'},
                ],
            },
            {
                'categorie': {
                    'nom': 'Boissons',
                    'ordre_affichage': 4,
                    'image': 'categories/boissons.png'
                },
                'plats': [
                    {'nom': 'Thé à la Menthe', 'description': 'Thé vert traditionnel à la menthe fraîche', 'prix': '3.00', 'temps_preparation': 5, 'image': 'plats/the_menthe.png'},
                    {'nom': "Jus d'Orange Frais", 'description': 'Oranges pressées à la demande', 'prix': '4.00', 'temps_preparation': 5, 'image': 'plats/jus_orange.png'},
                    {'nom': 'Lben', 'description': 'Lait fermenté traditionnel frais', 'prix': '2.50', 'temps_preparation': 2, 'image': 'plats/lben.png'},
                    {'nom': 'Café Noir/Cassé', 'description': 'Café fraîchement moulu', 'prix': '3.50', 'temps_preparation': 5, 'image': 'plats/cafe.png'},
                    {'nom': 'Café au Lait', 'description': 'Café mélangé with du lait chaud', 'prix': '4.00', 'temps_preparation': 5, 'image': 'plats/cafe_lait.png'},
                    {'nom': 'Café à la Menthe', 'description': 'Café infusé with de la menthe fraîche', 'prix': '4.50', 'temps_preparation': 5, 'image': 'plats/cafe_menthe.png'},
                    {'nom': 'Café aux Épices', 'description': 'Café aromatisé with de la cannelle et du gingembre', 'prix': '4.50', 'temps_preparation': 5, 'image': 'plats/cafe_epices.png'},
                ],
            },
        ]

        total_categories = total_plats = 0
        for entry in SEED_DATA:
            cat_info = entry['categorie']
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

        self.stdout.write(self.style.SUCCESS(f'\nSeeding complete: {total_categories} new categories, {total_plats} new dishes.'))

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
            {'nom': 'Lait', 'unite_mesure': 'ml', 'stock_actuel': 2000, 'seuil_alerte': 500},
            {'nom': 'Fromage blanc', 'unite_mesure': 'g', 'stock_actuel': 1500, 'seuil_alerte': 300},
            
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
                ('Tomate', 200),
                ('Concombre', 150),
                ('Oignon', 100),
                ('Persil frais', 50),
                ('Huile d\'olive', 30),
            ],
            'Zaalouk': [
                ('Aubergine', 300),
                ('Tomate', 200),
                ('Ail', 20),
                ('Huile d\'olive', 30),
                ('Persil frais', 20),
            ],
            'Briouates au Fromage': [
                ('Feuille de brick', 4),
                ('Fromage blanc', 100),
                ('Œuf', 1),
                ('Huile d\'olive', 50),
            ],
            'Soupe Harira': [
                ('Pois chiches', 100),
                ('Lentilles vertes', 100),
                ('Tomate', 150),
                ('Oignon', 100),
                ('Gingembre', 10),
                ('Curcuma', 3),
                ('Huile d\'olive', 30),
            ],
            'Salade César': [
                ('Laitue', 200),
                ('Fromage blanc', 50),
                ('Œuf', 1),
                ('Huile d\'olive', 30),
                ('Citron', 0.5),
            ],
            'Tajine Poulet': [
                ('Poulet fermier', 400),
                ('Oignon', 150),
                ('Citron confit', 100),
                ('Olives vertes', 100),
                ('Gingembre', 10),
                ('Curcuma', 5),
                ('Huile d\'olive', 50),
            ],
            'Tajine Agneau': [
                ('Agneau', 400),
                ('Oignon', 150),
                ('Pruneaux', 100),
                ('Amandes', 50),
                ('Gingembre', 10),
                ('Cannelle', 5),
                ('Huile d\'olive', 50),
            ],
            'Couscous Royal': [
                ('Semoule fine', 300),
                ('Poulet fermier', 200),
                ('Merguez', 150),
                ('Carotte', 100),
                ('Oignon', 100),
                ('Pois chiches', 50),
                ('Huile d\'olive', 50),
            ],
            'Mechoui': [
                ('Agneau', 800),
                ('Huile d\'olive', 50),
                ('Sel fin', 10),
                ('Cumin', 5),
            ],
            'Rfissa': [
                ('Poulet fermier', 400),
                ('Lentilles vertes', 150),
                ('Œuf', 2),
                ('Oignon', 100),
                ('Gingembre', 10),
                ('Huile d\'olive', 50),
            ],
            'Tanjia Marrakchia': [
                ('Boeuf', 500),
                ('Oignon', 150),
                ('Gingembre', 15),
                ('Ail', 20),
                ('Huile d\'olive', 50),
            ],
            'Pastilla au Poulet': [
                ('Feuille de pâte phyllo', 200),
                ('Poulet fermier', 300),
                ('Œuf', 2),
                ('Amandes', 50),
                ('Cannelle', 3),
                ('Miel', 30),
            ],
            'Pastilla aux Poissons': [
                ('Feuille de pâte phyllo', 200),
                ('Poisson blanc', 250),
                ('Crevettes', 100),
                ('Œuf', 2),
                ('Gingembre', 5),
                ('Cumin', 3),
            ],
            'Tajine de Poisson': [
                ('Poisson blanc', 400),
                ('Tomate', 150),
                ('Oignon', 100),
                ('Citron', 1),
                ('Gingembre', 10),
                ('Curcuma', 3),
                ('Huile d\'olive', 40),
            ],
            'Tajine de Légumes': [
                ('Carotte', 150),
                ('Courgette', 150),
                ('Pois chiches', 100),
                ('Tomate', 100),
                ('Oignon', 100),
                ('Gingembre', 10),
                ('Huile d\'olive', 40),
            ],
            'Thé à la Menthe': [
                ('Thé vert', 5),
                ('Menthe fraîche', 20),
                ('Miel', 15),
            ],
            'Jus d\'Orange Frais': [
                ('Orange', 3),
            ],
            'Café Noir/Cassé': [
                ('Café moulu', 10),
            ],
            'Café au Lait': [
                ('Café moulu', 10),
                ('Lait', 150),
            ],
            'Café à la Menthe': [
                ('Café moulu', 10),
                ('Menthe fraîche', 10),
                ('Lait', 100),
            ],
            'Café aux Épices': [
                ('Café moulu', 10),
                ('Cannelle', 2),
                ('Gingembre', 2),
                ('Lait', 100),
            ],
            'Cornes de Gazelle': [
                ('Feuille de pâte phyllo', 100),
                ('Amandes', 80),
                ('Miel', 40),
                ('Cannelle', 3),
                ('Œuf', 1),
            ],
            'Chebakia': [
                ('Farine', 200),
                ('Miel', 100),
                ('Sésame', 50),
                ('Anis', 5),
            ],
            'Briouates au Miel': [
                ('Feuille de brick', 3),
                ('Amandes', 60),
                ('Miel', 50),
                ('Cannelle', 2),
                ('Œuf', 1),
            ],
            'Salade d\'Oranges': [
                ('Orange', 4),
                ('Cannelle', 2),
            ],
            'Msemen au Miel': [
                ('Farine', 150),
                ('Beurre', 50),
                ('Miel', 50),
            ],
            'Ghriba aux Amandes': [
                ('Amandes', 150),
                ('Farine', 100),
                ('Œuf', 1),
                ('Beurre', 50),
            ],
            'Ghriba aux Noix': [
                ('Noix', 150),
                ('Farine', 100),
                ('Œuf', 1),
                ('Beurre', 50),
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
