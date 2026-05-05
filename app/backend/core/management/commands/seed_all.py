from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.tables.models import Table
from apps.menu.models import Categorie, Plat
from apps.hr.models import Employe
from django.db import transaction

class Command(BaseCommand):
    help = 'Seed the database with users, tables, menu, and HR data.'

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                self.seed_users()
                self.seed_tables()
                self.seed_menu()
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
                'email': 'serveur@tastify.local',
                'role': User.Role.SERVEUR,
                'first_name': 'Omar',
                'last_name': 'Alami',
                'is_staff': True
            },
            {
                'username': 'serveur2_test',
                'email': 'serveur2@tastify.local',
                'role': User.Role.SERVEUR,
                'first_name': 'Sara',
                'last_name': 'Bennani',
                'is_staff': True
            },
            {
                'username': 'serveur3_test',
                'email': 'serveur3@tastify.local',
                'role': User.Role.SERVEUR,
                'first_name': 'Youssef',
                'last_name': 'Idrissi',
                'is_staff': True
            },
            {
                'username': 'cuisinier_test',
                'email': 'cuisinier@tastify.local',
                'role': User.Role.CUISINIER,
                'first_name': 'Fatine',
                'last_name': 'Zahra',
                'is_staff': True
            },
            {
                'username': 'cuisinier2_test',
                'email': 'cuisinier2@tastify.local',
                'role': User.Role.CUISINIER,
                'first_name': 'Driss',
                'last_name': 'Mansouri',
                'is_staff': True
            },
            {
                'username': 'cuisinier3_test',
                'email': 'cuisinier3@tastify.local',
                'role': User.Role.CUISINIER,
                'first_name': 'Amina',
                'last_name': 'Tazi',
                'is_staff': True
            },
            {
                'username': 'client_test',
                'email': 'client@tastify.local',
                'role': User.Role.CLIENT,
                'first_name': 'Karim',
                'last_name': 'Sadiki',
                'is_staff': False
            },
            {
                'username': 'client2_test',
                'email': 'client2@tastify.local',
                'role': User.Role.CLIENT,
                'first_name': 'Salma',
                'last_name': 'Rami',
                'is_staff': False
            },
            {
                'username': 'client3_test',
                'email': 'client3@tastify.local',
                'role': User.Role.CLIENT,
                'first_name': 'Amine',
                'last_name': 'Chraibi',
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
            (11, 6), (12, 6), (13, 6), (14, 6), (15, 6),
            (16, 8), (17, 8), (18, 4), (19, 2), (20, 2),
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

    def seed_hr(self):
        User = get_user_model()
        staff_users = User.objects.exclude(role=User.Role.CLIENT)
        
        positions = {
            User.Role.GERANT: ('Directeur de Restaurant', 12000.00),
            User.Role.SERVEUR: ('Chef de Rang', 4500.00),
            User.Role.CUISINIER: ('Chef de Partie', 5500.00),
        }

        created = updated = 0
        for user in staff_users:
            pos_name, base_salary = positions.get(user.role, ('Employé', 4000.00))
            
            # Simple unique CIN and phone generation based on ID
            cin = f"AB{100000 + user.id}"
            phone = f"06{str(user.id).zfill(8)}"
            
            _, was_created = Employe.objects.update_or_create(
                user=user,
                defaults={
                    'poste': pos_name,
                    'salaire': base_salary,
                    'date_embauche': timezone.now().date(),
                    'telephone': phone,
                    'adresse': 'Adresse de test, Casablanca',
                    'cin': cin,
                }
            )
            if was_created:
                created += 1
            else:
                updated += 1
        
        self.stdout.write(self.style.SUCCESS(f'HR seeding complete: {created} created, {updated} updated.'))
