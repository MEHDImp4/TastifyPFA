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
            {'nom': 'Salade Marocaine', 'description': 'Tomates, concombres, oignons et persil frais', 'prix': '6.00', 'temps_preparation': 10},
            {'nom': 'Zaalouk', 'description': 'Caviar d\'aubergines grillées aux tomates et épices', 'prix': '7.50', 'temps_preparation': 15},
            {'nom': 'Briouates au Fromage', 'description': 'Feuilletés croustillants au fromage (4 pièces)', 'prix': '9.00', 'temps_preparation': 12},
            {'nom': 'Soupe Harira', 'description': 'Soupe traditionnelle marocaine riche et parfumée', 'prix': '6.50', 'temps_preparation': 15},
            {'nom': 'Salade César', 'description': 'Salade fraîche avec croûtons et sauce maison', 'prix': '8.50', 'temps_preparation': 10},
        ],
    },
    {
        'categorie': {
            'nom': 'Plats Principaux',
            'ordre_affichage': 2,
            'image': 'categories/plats_principaux.png'
        },
        'plats': [
            {'nom': 'Tajine Poulet', 'description': 'Poulet aux olives et citron confit', 'prix': '22.00', 'temps_preparation': 35},
            {'nom': 'Tajine Agneau', 'description': 'Agneau aux pruneaux et amandes grillées', 'prix': '26.00', 'temps_preparation': 40},
            {'nom': 'Couscous Royal', 'description': 'Semoule fine, sept légumes, poulet et merguez', 'prix': '25.00', 'temps_preparation': 40},
            {'nom': 'Mechoui', 'description': 'Épaule d\'agneau rôtie lentement aux épices', 'prix': '30.00', 'temps_preparation': 45},
            {'nom': 'Rfissa', 'description': 'Poulet fermier, lentilles et crêpes msemen émiettées', 'prix': '24.00', 'temps_preparation': 40},
            {'nom': 'Tanjia Marrakchia', 'description': 'Viande de boeuf fondante cuite à l\'étouffée', 'prix': '28.00', 'temps_preparation': 45},
            {'nom': 'Pastilla au Poulet', 'description': 'Feuilleté sucré-salé traditionnel à la cannelle', 'prix': '18.00', 'temps_preparation': 30},
            {'nom': 'Pastilla aux Poissons', 'description': 'Feuilleté épicé aux fruits de mer et vermicelles', 'prix': '20.00', 'temps_preparation': 35},
        ],
    },
    {
        'categorie': {
            'nom': 'Desserts',
            'ordre_affichage': 3,
            'image': 'categories/desserts.png'
        },
        'plats': [
            {'nom': 'Cornes de Gazelle', 'description': 'Gâteaux sablés à la pâte d\'amande (3 pièces)', 'prix': '6.00', 'temps_preparation': 5},
            {'nom': 'Chebakia', 'description': 'Gâteaux au miel, sésame et anis (assiette)', 'prix': '5.00', 'temps_preparation': 5},
            {'nom': 'Briouates au Miel', 'description': 'Feuilletés aux amandes et miel (3 pièces)', 'prix': '7.00', 'temps_preparation': 8},
            {'nom': 'Salade d\'Oranges', 'description': 'Oranges à la cannelle et eau de fleur d\'oranger', 'prix': '6.00', 'temps_preparation': 10},
        ],
    },
    {
        'categorie': {
            'nom': 'Boissons',
            'ordre_affichage': 4,
            'image': 'categories/boissons.png'
        },
        'plats': [
            {'nom': 'Thé à la Menthe', 'description': 'Thé vert traditionnel à la menthe fraîche', 'prix': '3.00', 'temps_preparation': 5},
            {'nom': 'Jus d\'Orange Frais', 'description': 'Oranges pressées à la demande', 'prix': '4.00', 'temps_preparation': 5},
            {'nom': 'Lben', 'description': 'Lait fermenté traditionnel frais', 'prix': '2.50', 'temps_preparation': 2},
            {'nom': 'Café Noir/Cassé', 'description': 'Café fraîchement moulu', 'prix': '3.50', 'temps_preparation': 5},
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed the database with sample categories and dishes'

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