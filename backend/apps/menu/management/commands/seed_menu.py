from django.core.management.base import BaseCommand
from apps.menu.models import Categorie, Plat


SEED_DATA = [
    {
        'categorie': {
            'nom': 'Entrées',
            'ordre_affichage': 1,
            'image': 'categories/entrees.png'
        },
        'plats': [
            {'nom': 'Salade Marocaine', 'description': 'Tomates, concombres, oignons et persil frais', 'prix': '6.00', 'temps_preparation': 10, 'image': 'plats/salade_marocaine.png'},
            {'nom': 'Zaalouk', 'description': 'Caviar d\'aubergines grillées aux tomates et épices', 'prix': '7.50', 'temps_preparation': 15, 'image': 'plats/zaalouk.png'},
            {'nom': 'Briouates au Fromage', 'description': 'Feuilletés croustillants au fromage (4 pièces)', 'prix': '9.00', 'temps_preparation': 12, 'image': 'plats/briouates_fromage.png'},
            {'nom': 'Soupe Harira', 'description': 'Soupe traditionnelle marocaine riche et parfumée', 'prix': '6.50', 'temps_preparation': 15, 'image': 'plats/soupe_harira.png'},
            {'nom': 'Salade César', 'description': 'Salade fraîche avec croûtons et sauce maison', 'prix': '8.50', 'temps_preparation': 10, 'image': 'plats/salade_cesar.png'},
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
            {'nom': 'Tajine Agneau', 'description': 'Agneau aux pruneaux et amandes grillées', 'prix': '26.00', 'temps_preparation': 40, 'image': 'plats/tajine_agneau.png'},
            {'nom': 'Couscous Royal', 'description': 'Semoule fine, sept légumes, poulet et merguez', 'prix': '25.00', 'temps_preparation': 40, 'image': 'plats/couscous_royal.png'},
            {'nom': 'Mechoui', 'description': 'Épaule d\'agneau rôtie lentement aux épices', 'prix': '30.00', 'temps_preparation': 45, 'image': 'plats/mechoui.png'},
            {'nom': 'Rfissa', 'description': 'Poulet fermier, lentilles et crêpes msemen émiettées', 'prix': '24.00', 'temps_preparation': 40, 'image': 'plats/rfissa.png'},
            {'nom': 'Tanjia Marrakchia', 'description': 'Viande de boeuf fondante cuite à l\'étouffée', 'prix': '28.00', 'temps_preparation': 45, 'image': 'plats/tanjia_marrakchia.png'},
            {'nom': 'Pastilla au Poulet', 'description': 'Feuilleté sucré-salé traditionnel à la cannelle', 'prix': '18.00', 'temps_preparation': 30, 'image': 'plats/pastilla_poulet.png'},
            {'nom': 'Pastilla aux Poissons', 'description': 'Feuilleté épicé aux fruits de mer et vermicelles', 'prix': '20.00', 'temps_preparation': 35, 'image': 'plats/pastilla_poissons.png'},
        ],
    },
    {
        'categorie': {
            'nom': 'Desserts',
            'ordre_affichage': 3,
            'image': 'categories/desserts.png'
        },
        'plats': [
            {'nom': 'Cornes de Gazelle', 'description': 'Gâteaux sablés à la pâte d\'amande (3 pièces)', 'prix': '6.00', 'temps_preparation': 5, 'image': 'plats/cornes_gazelle.png'},
            {'nom': 'Chebakia', 'description': 'Gâteaux au miel, sésame et anis (assiette)', 'prix': '5.00', 'temps_preparation': 5, 'image': 'plats/chebakia.png'},
            {'nom': 'Briouates au Miel', 'description': 'Feuilletés aux amandes et miel (3 pièces)', 'prix': '7.00', 'temps_preparation': 8, 'image': 'plats/briouates_miel.png'},
            {'nom': 'Salade d\'Oranges', 'description': 'Oranges à la cannelle et eau de fleur d\'oranger', 'prix': '6.00', 'temps_preparation': 10, 'image': 'plats/salade_oranges.png'},
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
            {'nom': 'Jus d\'Orange Frais', 'description': 'Oranges pressées à la demande', 'prix': '4.00', 'temps_preparation': 5, 'image': 'plats/jus_orange.png'},
            {'nom': 'Lben', 'description': 'Lait fermenté traditionnel frais', 'prix': '2.50', 'temps_preparation': 2, 'image': 'plats/lben.png'},
            {'nom': 'Café Noir/Cassé', 'description': 'Café fraîchement moulu', 'prix': '3.50', 'temps_preparation': 5, 'image': 'plats/cafe.png'},
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed the database with sample categories and dishes including images'

    def handle(self, *args, **options):
        total_categories = 0
        total_plats = 0

        for entry in SEED_DATA:
            cat, created = Categorie.objects.update_or_create(
                nom=entry['categorie']['nom'],
                defaults={
                    'ordre_affichage': entry['categorie']['ordre_affichage'],
                    'image': entry['categorie'].get('image'),
                },
            )
            if created:
                total_categories += 1
                self.stdout.write(self.style.SUCCESS(f'  Created category: {cat.nom}'))
            else:
                self.stdout.write(f'  Updated category: {cat.nom}')

            for plat_data in entry['plats']:
                plat, created = Plat.objects.update_or_create(
                    nom=plat_data['nom'],
                    defaults={
                        'categorie': cat,
                        'description': plat_data.get('description', ''),
                        'prix': plat_data['prix'],
                        'temps_preparation': plat_data.get('temps_preparation', 15),
                        'image': plat_data.get('image'),
                    },
                )
                if created:
                    total_plats += 1
                    self.stdout.write(self.style.SUCCESS(f'    Created dish: {plat.nom}'))
                else:
                    self.stdout.write(f'    Updated dish: {plat.nom}')

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSeeding complete: {total_categories} new categories, {total_plats} new dishes.'
            )
        )