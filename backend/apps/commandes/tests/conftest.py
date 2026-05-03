from decimal import Decimal
import pytest
from django.contrib.auth import get_user_model

from apps.commandes.models import Commande, CommandeLigne
from apps.menu.models import Categorie, Plat
from apps.tables.models import Table


@pytest.fixture
def categorie(db):
    return Categorie.objects.create(nom='Cuisine', ordre_affichage=1)


@pytest.fixture
def plat_short(db, categorie):
    return Plat.objects.create(
        categorie=categorie,
        nom='Salade',
        prix=Decimal('25.00'),
        temps_preparation=10,
    )


@pytest.fixture
def plat_long(db, categorie):
    return Plat.objects.create(
        categorie=categorie,
        nom='Tagine',
        prix=Decimal('80.00'),
        temps_preparation=30,
    )


@pytest.fixture
def table_obj(db):
    return Table.objects.create(numero=42, capacite=4)


@pytest.fixture
def commande_with_lines(db, table_obj, plat_short, plat_long):
    commande = Commande.objects.create(table=table_obj, statut=Commande.Statut.EN_CUISINE)
    line_short = CommandeLigne.objects.create(
        commande=commande, plat=plat_short, quantite=1
    )
    line_long = CommandeLigne.objects.create(
        commande=commande, plat=plat_long, quantite=1
    )
    return commande, line_short, line_long
