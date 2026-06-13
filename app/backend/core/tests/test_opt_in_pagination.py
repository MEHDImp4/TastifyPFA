import datetime

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.avis.models import Avis
from apps.hr.models import Employe
from apps.menu.models import Categorie, Plat
from apps.reservations.models import Reservation
from apps.stock.models import Ingredient
from apps.tables.models import Table
from apps.users.models import Utilisateur


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def gerant_user(db):
    return Utilisateur.objects.create_user(
        username='pagination-gerant',
        password='password123',
        role=Utilisateur.Role.GERANT,
    )


@pytest.fixture
def client_user(db):
    return Utilisateur.objects.create_user(
        username='pagination-client',
        password='password123',
        first_name='Nora',
        last_name='Client',
        role=Utilisateur.Role.CLIENT,
    )


@pytest.mark.django_db
def test_plats_keep_array_shape_without_pagination_params(api_client):
    category = Categorie.objects.create(nom='Entrées', ordre_affichage=1)
    Plat.objects.create(nom='Briouate', categorie=category, prix='45.00')

    response = api_client.get(reverse('plat-list'))

    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.data, list)
    assert response.data[0]['nom'] == 'Briouate'


@pytest.mark.django_db
def test_plats_return_paginated_envelope_and_cap_page_size(api_client):
    category = Categorie.objects.create(nom='Signatures', ordre_affichage=1)
    for index in range(105):
        Plat.objects.create(
            nom=f'Plat {index:03d}',
            categorie=category,
            prix='70.00',
        )

    response = api_client.get(reverse('plat-list'), {'page_size': 500})

    assert response.status_code == status.HTTP_200_OK
    assert response.data['count'] == 105
    assert len(response.data['results']) == 100
    assert response.data['next'] is not None


@pytest.mark.django_db
def test_plats_support_search_and_category_filters(api_client):
    mains = Categorie.objects.create(nom='Plats', ordre_affichage=1)
    desserts = Categorie.objects.create(nom='Desserts', ordre_affichage=2)
    tajine = Plat.objects.create(nom='Tajine citron', categorie=mains, prix='90.00')
    Plat.objects.create(nom='Pastilla sucre', categorie=desserts, prix='55.00')

    response = api_client.get(
        reverse('plat-list'),
        {'page': 1, 'page_size': 10, 'search': 'citron', 'categorie': mains.id},
    )

    assert response.status_code == status.HTTP_200_OK
    assert [item['id'] for item in response.data['results']] == [tajine.id]


@pytest.mark.django_db
def test_stock_pagination_is_opt_in_and_searchable(api_client, gerant_user):
    Ingredient.objects.create(nom='Safran', unite_mesure='g', stock_actuel=10, seuil_alerte=2)
    Ingredient.objects.create(nom='Menthe', unite_mesure='g', stock_actuel=50, seuil_alerte=5)
    api_client.force_authenticate(user=gerant_user)

    response = api_client.get(
        '/api/stock/ingredients/',
        {'page': 1, 'page_size': 5, 'search': 'saf'},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data['count'] == 1
    assert response.data['results'][0]['nom'] == 'Safran'


@pytest.mark.django_db
def test_hr_pagination_supports_search_and_poste(api_client, gerant_user):
    serveur_user = Utilisateur.objects.create_user(
        username='amine-service',
        password='password123',
        first_name='Amine',
        role=Utilisateur.Role.SERVEUR,
    )
    cuisinier_user = Utilisateur.objects.create_user(
        username='chef-kitchen',
        password='password123',
        first_name='Karim',
        role=Utilisateur.Role.CUISINIER,
    )
    Employe.objects.create(
        user=serveur_user,
        poste='SERVEUR',
        salaire=3500,
        date_embauche=datetime.date(2026, 1, 1),
        cin='SERVEUR-001',
    )
    Employe.objects.create(
        user=cuisinier_user,
        poste='CUISINIER',
        salaire=4500,
        date_embauche=datetime.date(2026, 2, 1),
        cin='CUISINIER-001',
    )
    api_client.force_authenticate(user=gerant_user)

    response = api_client.get(
        reverse('employe-list'),
        {'page': 1, 'page_size': 10, 'poste': 'SERVEUR', 'search': 'amine'},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data['count'] == 1
    assert response.data['results'][0]['poste'] == 'SERVEUR'


@pytest.mark.django_db
def test_reservations_pagination_keeps_existing_filters(api_client, gerant_user, client_user):
    table = Table.objects.create(numero=12, capacite=4)
    matching = Reservation.objects.create(
        client=client_user,
        table=table,
        date_reservation=datetime.date(2030, 5, 4),
        heure_debut=datetime.time(19, 0),
        heure_fin=datetime.time(20, 0),
        nombre_personnes=2,
        statut=Reservation.Statut.CONFIRMEE,
    )
    Reservation.objects.create(
        client=client_user,
        table=table,
        date_reservation=datetime.date(2030, 5, 5),
        heure_debut=datetime.time(19, 0),
        heure_fin=datetime.time(20, 0),
        nombre_personnes=2,
        statut=Reservation.Statut.ANNULEE,
    )
    api_client.force_authenticate(user=gerant_user)

    response = api_client.get(
        reverse('reservation-list'),
        {
            'page': 1,
            'page_size': 10,
            'date_reservation': '2030-05-04',
            'statut': Reservation.Statut.CONFIRMEE,
            'search': 'Nora',
        },
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data['count'] == 1
    assert response.data['results'][0]['id'] == matching.id


@pytest.mark.django_db
def test_avis_pagination_supports_search(api_client, gerant_user, client_user):
    Avis.objects.create(user=client_user, commentaire='Service impeccable', note=5)
    Avis.objects.create(user=client_user, commentaire='Dessert moyen', note=3)
    api_client.force_authenticate(user=gerant_user)

    response = api_client.get(
        reverse('avis-list'),
        {'page': 1, 'page_size': 10, 'search': 'impeccable'},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data['count'] == 1
    assert response.data['results'][0]['commentaire'] == 'Service impeccable'
