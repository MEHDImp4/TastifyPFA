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
            {'nom': 'Salade César', 'description': 'Salade fraîche avec croûtons', 'prix': '8.50', 'temps_preparation': 10},
            {'nom': 'Soupe Harira', 'description': 'Soupe traditionnelle marocaine', 'prix': '6.00', 'temps_preparation': 15},
            {'nom': 'Briouates au Fromage', 'description': 'Feuilletés croustillants au fromage', 'prix': '9.00', 'temps_preparation': 12},
        ],
    },
    {
        'categorie': {
            'nom': 'Plats Principaux',
            'ordre_affichage': 2,
            'image': 'categories/plats_principaux.png'
        },
        'plats': [
            {'nom': 'Tajine Poulet', 'description': 'Tajine de poulet aux olives et citron confit', 'prix': '22.00', 'temps_preparation': 35},
            {'nom': 'Couscous Royal', 'description': 'Couscous avec merguez, poulet et légumes', 'prix': '25.00', 'temps_preparation': 40},
            {'nom': 'Pastilla au Poulet', 'description': 'Feuilleté sucré-salé traditionnel', 'prix': '18.00', 'temps_preparation': 30},
        ],
    },
    {
        'categorie': {
            'nom': 'Desserts',
            'ordre_affichage': 3,
            'image': 'categories/desserts.png'
        },
        'plats': [
            {'nom': 'Cornes de Gazelle', 'description': 'Gâteaux sablés à la pâte d\'amande', 'prix': '5.00', 'temps_preparation': 5},
            {'nom': 'Chebakia', 'description': 'Gâteaux au miel et sésame', 'prix': '4.50', 'temps_preparation': 5},
            {'nom': 'Crème Caramel', 'description': 'Crème caramel maison', 'prix': '6.50', 'temps_preparation': 8},
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
                plat, created = Plat.objects.get_or_create(
                    categorie=cat,
                    nom=plat_data['nom'],
                    defaults={
                        'description': plat_data.get('description', ''),
                        'prix': plat_data['prix'],
                        'temps_preparation': plat_data.get('temps_preparation', 15),
                    },
                )
                if created:
                    total_plats += 1
                    self.stdout.write(self.style.SUCCESS(f'    Created dish: {plat.nom}'))

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSeeding complete: {total_categories} new categories, {total_plats} new dishes.'
            )
        )