from decimal import Decimal

import pytest

from apps.commandes.models import Commande, CommandeLigne
from apps.menu.models import Categorie, Plat
from apps.tables.models import Table


@pytest.fixture
def paiement_categorie(db):
    return Categorie.objects.create(nom='Paiements', ordre_affichage=1)


@pytest.fixture
def paiement_plat_short(db, paiement_categorie):
    return Plat.objects.create(
        categorie=paiement_categorie,
        nom='Jus',
        prix=Decimal('10.00'),
        temps_preparation=5,
    )


@pytest.fixture
def paiement_plat_long(db, paiement_categorie):
    return Plat.objects.create(
        categorie=paiement_categorie,
        nom='Plat du jour',
        prix=Decimal('15.00'),
        temps_preparation=20,
    )


@pytest.fixture
def paiement_table(db):
    return Table.objects.create(numero=260, capacite=4)


@pytest.fixture
def payable_commande(db, paiement_table):
    return Commande.objects.create(
        table=paiement_table,
        statut=Commande.Statut.EN_COURS,
        montant_total=Decimal('25.00'),
    )


@pytest.fixture
def payable_commande_with_lines(db, payable_commande, paiement_plat_short, paiement_plat_long):
    line_short = CommandeLigne.objects.create(
        commande=payable_commande,
        plat=paiement_plat_short,
        quantite=1,
    )
    line_long = CommandeLigne.objects.create(
        commande=payable_commande,
        plat=paiement_plat_long,
        quantite=1,
    )
    payable_commande.refresh_from_db()
    return payable_commande, line_short, line_long
