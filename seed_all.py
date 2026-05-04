#!/usr/bin/env python
"""Seed the database with users, tables and menu.

Run from repository root:
  python seed_all.py
"""

import os
import sys

# Use the same settings module as the project
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tastify_backend.settings.dev')

import django
django.setup()

from django.contrib.auth import get_user_model
from apps.tables.models import Table
from apps.menu.models import Categorie, Plat


def seed_users():
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
            print(f'Created user: {username}')
        else:
            updated += 1
            print(f'Updated user: {username}')

    print(f'Users seeding complete: {created} created, {updated} updated.')


def seed_tables():
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

    print(f'Table seeding complete: {created} created, {updated} updated.')


def seed_menu():
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
            print(f'  Created category: {cat.nom}')
        else:
            print(f'  Updated category: {cat.nom}')

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
                print(f'    Created dish: {plat.nom}')
            else:
                print(f'    Updated dish: {plat.nom}')

    print(f'\nSeeding complete: {total_categories} new categories, {total_plats} new dishes.')


def main():
    try:
        seed_users()
        seed_tables()
        seed_menu()
        print('\nAll seeding tasks completed.')
    except Exception as exc:
        print('Error during seeding:', exc)
        sys.exit(1)


if __name__ == '__main__':
    main()
