import pytest
from decimal import Decimal
from apps.tables.models import Table
from apps.menu.models import Categorie, Plat
from apps.commandes.models import Commande, CommandeLigne


@pytest.fixture
def table(db):
    return Table.objects.create(numero=1, capacite=4)


@pytest.fixture
def categorie(db):
    return Categorie.objects.create(nom="Test Category")


@pytest.fixture
def plat(db, categorie):
    return Plat.objects.create(
        nom="Test Plat",
        prix=Decimal("10.00"),
        categorie=categorie
    )


@pytest.fixture
def paiement_table(db):
    return Table.objects.create(numero=101, capacite=4)


@pytest.fixture
def payable_commande_with_lines(db, paiement_table, plat):
    commande = Commande.objects.create(
        table=paiement_table,
        statut=Commande.Statut.EN_COURS,
        montant_total=Decimal('25.00'),
        est_active=True,
    )
    # line 1: 10.00
    line1 = CommandeLigne.objects.create(
        commande=commande,
        plat=plat,
        quantite=1,
        prix_unitaire=Decimal('10.00'),
    )
    # line 2: 15.00
    line2 = CommandeLigne.objects.create(
        commande=commande,
        plat=plat,
        quantite=1,
        prix_unitaire=Decimal('15.00'),
    )
    return commande, line1, line2
