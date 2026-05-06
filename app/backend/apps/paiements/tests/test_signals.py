from decimal import Decimal

import pytest

from apps.commandes.models import Commande
from apps.paiements.models import Paiement
from apps.paiements.services import complete_payment, create_payment


@pytest.mark.django_db
def test_completing_remaining_balance_marks_commande_paid(payable_commande_with_lines):
    commande, _, _ = payable_commande_with_lines
    paiement = create_payment(
        commande_id=commande.id,
        montant=Decimal('25.00'),
        methode=Paiement.Methode.ESPECES,
        statut=Paiement.Statut.EN_ATTENTE,
    )

    complete_payment(paiement_id=paiement.id)

    commande.refresh_from_db()
    assert commande.statut == Commande.Statut.PAYEE
