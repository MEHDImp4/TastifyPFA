from decimal import Decimal

import pytest

from apps.commandes.models import Commande
from apps.paiements.exceptions import (
    AmbiguousPayableOrderError,
    LineContributionExceededError,
    NoPayableOrderError,
    OrderBalanceExceededError,
)
from apps.paiements.models import Paiement
from apps.paiements.services import (
    create_payment,
    preview_equal_split_for_table,
    resolve_payable_session,
    validate_item_contributions,
)


@pytest.mark.django_db
def test_resolve_payable_session_raises_when_no_matching_order(paiement_table):
    with pytest.raises(NoPayableOrderError):
        resolve_payable_session(table_id=paiement_table.id)


@pytest.mark.django_db
def test_resolve_payable_session_raises_when_multiple_payable_orders(paiement_table):
    Commande.objects.create(
        table=paiement_table,
        statut=Commande.Statut.EN_COURS,
        montant_total=Decimal('10.00'),
    )
    Commande.objects.create(
        table=paiement_table,
        statut=Commande.Statut.PRETE,
        montant_total=Decimal('12.00'),
    )

    with pytest.raises(AmbiguousPayableOrderError):
        resolve_payable_session(table_id=paiement_table.id)


@pytest.mark.django_db
def test_resolve_payable_session_excludes_payee_and_annulee_orders(paiement_table):
    Commande.objects.create(
        table=paiement_table,
        statut=Commande.Statut.PAYEE,
        montant_total=Decimal('10.00'),
    )
    Commande.objects.create(
        table=paiement_table,
        statut=Commande.Statut.ANNULEE,
        montant_total=Decimal('10.00'),
    )
    payable_order = Commande.objects.create(
        table=paiement_table,
        statut=Commande.Statut.EN_CUISINE,
        montant_total=Decimal('14.00'),
    )

    session = resolve_payable_session(table_id=paiement_table.id)

    assert session.commande_id == payable_order.id
    assert session.montant_restant == Decimal('14.00')


@pytest.mark.django_db
def test_equal_split_last_share_absorbs_rounding_residue(payable_commande_with_lines, paiement_table):
    preview = preview_equal_split_for_table(table_id=paiement_table.id, share_count=3)

    assert preview.share_amounts == (
        Decimal('8.33'),
        Decimal('8.33'),
        Decimal('8.34'),
    )
    assert sum(preview.share_amounts, Decimal('0.00')) == preview.total_amount


@pytest.mark.django_db
def test_validate_item_contributions_rejects_line_overpayment(payable_commande_with_lines):
    commande, line_short, _ = payable_commande_with_lines
    create_payment(
        commande_id=commande.id,
        montant=Decimal('7.00'),
        methode=Paiement.Methode.ESPECES,
        statut=Paiement.Statut.COMPLETE,
        contributions=[
            {'commande_ligne_id': line_short.id, 'montant_contribue': Decimal('7.00')},
        ],
    )

    with pytest.raises(LineContributionExceededError):
        validate_item_contributions(
            commande_id=commande.id,
            contributions=[
                {'commande_ligne_id': line_short.id, 'montant_contribue': Decimal('4.00')},
            ],
        )


@pytest.mark.django_db
def test_create_payment_prevents_order_overpayment(payable_commande_with_lines):
    commande, _, _ = payable_commande_with_lines
    create_payment(
        commande_id=commande.id,
        montant=Decimal('20.00'),
        methode=Paiement.Methode.ESPECES,
        statut=Paiement.Statut.COMPLETE,
    )

    with pytest.raises(OrderBalanceExceededError):
        create_payment(
            commande_id=commande.id,
            montant=Decimal('6.00'),
            methode=Paiement.Methode.ESPECES,
            statut=Paiement.Statut.COMPLETE,
        )


@pytest.mark.django_db
def test_create_payment_complete_marks_commande_paid(payable_commande_with_lines):
    commande, _, _ = payable_commande_with_lines

    create_payment(
        commande_id=commande.id,
        montant=Decimal('25.00'),
        methode=Paiement.Methode.ESPECES,
        statut=Paiement.Statut.COMPLETE,
    )

    commande.refresh_from_db()
    assert commande.statut == Commande.Statut.PAYEE
