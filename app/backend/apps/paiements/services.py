from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, Mapping

from django.db import transaction
from django.db.models import DecimalField, Sum, Value
from django.db.models.functions import Coalesce

from apps.commandes.models import Commande, CommandeLigne
from apps.paiements.constants import (
    CURRENCY_QUANTUM,
    PAYABLE_COMMANDE_STATUSES,
    ZERO_AMOUNT,
)
from apps.paiements.exceptions import (
    AmbiguousPayableOrderError,
    ContributionTotalMismatchError,
    InvalidContributionTargetError,
    InvalidPaymentAmountError,
    InvalidSplitConfigurationError,
    LineContributionExceededError,
    NoPayableOrderError,
    OrderBalanceExceededError,
)
from apps.paiements.models import Paiement, PaiementItem


@dataclass(frozen=True)
class PayableSession:
    table_id: int
    commande_id: int
    montant_total: Decimal
    montant_paye: Decimal
    montant_restant: Decimal
    items: list[dict]


@dataclass(frozen=True)
class EqualSplitPreview:
    commande_id: int
    total_amount: Decimal
    share_count: int
    share_amounts: tuple[Decimal, ...]


@dataclass(frozen=True)
class ContributionPreview:
    commande_ligne_id: int
    montant_contribue: Decimal
    montant_deja_couvert: Decimal
    montant_restant_ligne: Decimal


@dataclass(frozen=True)
class ItemContributionValidation:
    commande_id: int
    total_amount: Decimal
    contributions: tuple[ContributionPreview, ...]


def quantize_amount(value: Decimal | int | str) -> Decimal:
    return Decimal(value).quantize(CURRENCY_QUANTUM, rounding=ROUND_HALF_UP)


def get_completed_paid_total(*, commande_id: int) -> Decimal:
    return _aggregate_completed_payment_total(commande_id=commande_id)


def resolve_payable_session(*, table_id: int) -> PayableSession:
    with transaction.atomic():
        candidate_commandes = list(
            Commande.objects.select_for_update()
            .filter(
                table_id=table_id,
                est_active=True,
                statut__in=PAYABLE_COMMANDE_STATUSES,
            )
            .order_by('id')
        )

        payable_sessions: list[PayableSession] = []
        for commande in candidate_commandes:
            montant_paye = _aggregate_completed_payment_total(commande_id=commande.id)
            montant_restant = quantize_amount(commande.montant_total - montant_paye)
            
            if montant_restant > ZERO_AMOUNT:
                # Fetch items with their payment coverage
                lines = (
                    CommandeLigne.objects.filter(commande=commande)
                    .select_related('plat')
                    .order_by('id')
                )
                
                # Get existing contributions for these lines
                existing_contributions = {
                    row['commande_ligne']: row['total']
                    for row in (
                        PaiementItem.objects.filter(
                            commande_ligne__commande=commande,
                            paiement__statut=Paiement.Statut.COMPLETE,
                        )
                        .values('commande_ligne')
                        .annotate(total=Sum('montant_contribue'))
                    )
                }
                
                items_data = []
                for line in lines:
                    total_line = quantize_amount(line.quantite * line.prix_unitaire)
                    covered = quantize_amount(existing_contributions.get(line.id, ZERO_AMOUNT))
                    items_data.append({
                        'id': line.id,
                        'plat_nom': line.plat.nom,
                        'quantite': line.quantite,
                        'prix_unitaire': quantize_amount(line.prix_unitaire),
                        'total': total_line,
                        'deja_paye': covered,
                        'reste_a_payer': quantize_amount(total_line - covered),
                    })

                payable_sessions.append(
                    PayableSession(
                        table_id=table_id,
                        commande_id=commande.id,
                        montant_total=quantize_amount(commande.montant_total),
                        montant_paye=montant_paye,
                        montant_restant=montant_restant,
                        items=items_data
                    )
                )

        if not payable_sessions:
            raise NoPayableOrderError(f'No payable order found for table {table_id}.')
        if len(payable_sessions) > 1:
            raise AmbiguousPayableOrderError(
                f'Multiple payable orders found for table {table_id}.'
            )
        return payable_sessions[0]


def calculate_equal_split_shares(*, total_amount: Decimal, share_count: int) -> tuple[Decimal, ...]:
    if share_count <= 0:
        raise InvalidSplitConfigurationError('share_count must be greater than zero.')

    total_amount = quantize_amount(total_amount)
    base_share = quantize_amount(total_amount / share_count)
    share_amounts = [base_share for _ in range(share_count)]
    if share_count == 1:
        return (total_amount,)

    allocated_before_last = base_share * (share_count - 1)
    share_amounts[-1] = quantize_amount(total_amount - allocated_before_last)
    return tuple(share_amounts)


def preview_equal_split_for_table(*, table_id: int, share_count: int) -> EqualSplitPreview:
    payable_session = resolve_payable_session(table_id=table_id)
    return EqualSplitPreview(
        commande_id=payable_session.commande_id,
        total_amount=payable_session.montant_restant,
        share_count=share_count,
        share_amounts=calculate_equal_split_shares(
            total_amount=payable_session.montant_restant,
            share_count=share_count,
        ),
    )


def validate_item_contributions(
    *,
    commande_id: int,
    contributions: Iterable[Mapping[str, object]],
) -> ItemContributionValidation:
    with transaction.atomic():
        locked_commande = _lock_commande_for_payment(commande_id=commande_id)
        return _validate_item_contributions_locked(
            locked_commande=locked_commande,
            contributions=contributions,
        )


def create_payment(
    *,
    commande_id: int,
    montant: Decimal | int | str,
    methode: str,
    statut: str = Paiement.Statut.EN_ATTENTE,
    reference_transaction: str = '',
    contributions: Iterable[Mapping[str, object]] | None = None,
    client=None,
) -> Paiement:
    with transaction.atomic():
        locked_commande = _lock_commande_for_payment(commande_id=commande_id)
        normalized_amount = quantize_amount(montant)
        _ensure_positive_amount(normalized_amount)

        remaining_balance = _get_remaining_balance_locked(locked_commande=locked_commande)
        if normalized_amount > remaining_balance:
            raise OrderBalanceExceededError('Payment exceeds the remaining order balance.')

        validation = None
        if contributions:
            validation = _validate_item_contributions_locked(
                locked_commande=locked_commande,
                contributions=contributions,
            )
            if validation.total_amount != normalized_amount:
                raise ContributionTotalMismatchError(
                    'Contribution totals must match the payment amount.'
                )

        paiement = Paiement.objects.create(
            commande=locked_commande,
            client=client,
            montant=normalized_amount,
            methode=methode,
            statut=statut,
            reference_transaction=reference_transaction,
        )

        # Phase 45: Link the client to the Commande for history tracking if not already set
        if client and not locked_commande.client:
            locked_commande.client = client
            locked_commande.save(update_fields=['client', 'updated_at'])

        if validation is not None:
            PaiementItem.objects.bulk_create(
                [
                    PaiementItem(
                        paiement=paiement,
                        commande_ligne_id=contribution.commande_ligne_id,
                        montant_contribue=contribution.montant_contribue,
                    )
                    for contribution in validation.contributions
                ]
            )

        if statut == Paiement.Statut.COMPLETE:
            reconcile_commande_payment_status(commande_id=locked_commande.id)

        return paiement


def complete_payment(*, paiement_id: int, reference_transaction: str | None = None) -> Paiement:
    with transaction.atomic():
        paiement = Paiement.objects.select_for_update().select_related('commande').get(pk=paiement_id)
        if paiement.statut == Paiement.Statut.COMPLETE:
            return paiement

        locked_commande = _lock_commande_for_payment(commande_id=paiement.commande_id)
        remaining_balance = _get_remaining_balance_locked(locked_commande=locked_commande)
        if quantize_amount(paiement.montant) > remaining_balance:
            raise OrderBalanceExceededError('Payment exceeds the remaining order balance.')

        paiement.statut = Paiement.Statut.COMPLETE
        update_fields = ['statut', 'updated_at']
        if reference_transaction is not None:
            paiement.reference_transaction = reference_transaction
            update_fields.append('reference_transaction')
        paiement.save(update_fields=update_fields)
        reconcile_commande_payment_status(commande_id=locked_commande.id)
        return paiement


def reconcile_commande_payment_status(*, commande_id: int) -> Commande:
    with transaction.atomic():
        commande = Commande.objects.select_for_update().get(pk=commande_id)
        if not commande.est_active or commande.statut == Commande.Statut.ANNULEE:
            return commande

        montant_paye = _aggregate_completed_payment_total(commande_id=commande.id)
        if (
            montant_paye >= quantize_amount(commande.montant_total)
            and commande.statut != Commande.Statut.PAYEE
        ):
            commande.statut = Commande.Statut.PAYEE
            commande.save(update_fields=['statut', 'updated_at'])
        return commande


def _aggregate_completed_payment_total(*, commande_id: int) -> Decimal:
    total = (
        Paiement.objects.completed()
        .filter(commande_id=commande_id)
        .aggregate(
            total=Coalesce(
                Sum('montant'),
                Value(ZERO_AMOUNT),
                output_field=DecimalField(max_digits=10, decimal_places=2),
            )
        )['total']
    )
    return quantize_amount(total)


def _lock_commande_for_payment(*, commande_id: int) -> Commande:
    commande = Commande.objects.select_for_update().filter(pk=commande_id).first()
    if commande is None:
        raise NoPayableOrderError(f'Commande {commande_id} does not exist.')
    if not commande.est_active or commande.statut not in PAYABLE_COMMANDE_STATUSES:
        raise NoPayableOrderError(f'Commande {commande_id} is not payable.')
    return commande


def _ensure_positive_amount(amount: Decimal) -> None:
    if amount <= ZERO_AMOUNT:
        raise InvalidPaymentAmountError('Payment amounts must be greater than zero.')


def _get_remaining_balance_locked(*, locked_commande: Commande) -> Decimal:
    montant_paye = _aggregate_completed_payment_total(commande_id=locked_commande.id)
    return quantize_amount(locked_commande.montant_total - montant_paye)


def _validate_item_contributions_locked(
    *,
    locked_commande: Commande,
    contributions: Iterable[Mapping[str, object]],
) -> ItemContributionValidation:
    normalized_contributions = _normalize_contributions(contributions)
    if not normalized_contributions:
        raise InvalidSplitConfigurationError('At least one contribution is required.')

    line_ids = sorted(normalized_contributions)
    locked_lines = list(
        CommandeLigne.objects.select_for_update()
        .filter(commande_id=locked_commande.id, pk__in=line_ids)
        .order_by('id')
    )
    if len(locked_lines) != len(line_ids):
        raise InvalidContributionTargetError('One or more contribution lines are invalid.')

    existing_contributions = {
        row['commande_ligne']: quantize_amount(row['total'])
        for row in (
            PaiementItem.objects.filter(
                commande_ligne_id__in=line_ids,
                paiement__statut=Paiement.Statut.COMPLETE,
            )
            .values('commande_ligne')
            .annotate(
                total=Coalesce(
                    Sum('montant_contribue'),
                    Value(ZERO_AMOUNT),
                    output_field=DecimalField(max_digits=10, decimal_places=2),
                )
            )
        )
    }

    contribution_previews: list[ContributionPreview] = []
    total_amount = ZERO_AMOUNT

    for line in locked_lines:
        requested_amount = normalized_contributions[line.id]
        payable_amount = _get_line_payable_amount(line=line)
        existing_amount = existing_contributions.get(line.id, ZERO_AMOUNT)
        covered_amount = quantize_amount(existing_amount + requested_amount)
        if covered_amount > payable_amount:
            raise LineContributionExceededError(
                f'Contribution exceeds payable amount for line {line.id}.'
            )

        contribution_previews.append(
            ContributionPreview(
                commande_ligne_id=line.id,
                montant_contribue=requested_amount,
                montant_deja_couvert=existing_amount,
                montant_restant_ligne=quantize_amount(payable_amount - covered_amount),
            )
        )
        total_amount = quantize_amount(total_amount + requested_amount)

    remaining_balance = _get_remaining_balance_locked(locked_commande=locked_commande)
    if total_amount > remaining_balance:
        raise OrderBalanceExceededError('Contribution total exceeds the remaining order balance.')

    return ItemContributionValidation(
        commande_id=locked_commande.id,
        total_amount=total_amount,
        contributions=tuple(contribution_previews),
    )


def _normalize_contributions(
    contributions: Iterable[Mapping[str, object]],
) -> dict[int, Decimal]:
    normalized_contributions: dict[int, Decimal] = defaultdict(lambda: ZERO_AMOUNT)
    for contribution in contributions:
        try:
            line_id = int(contribution['commande_ligne_id'])
        except (KeyError, TypeError, ValueError) as exc:
            raise InvalidContributionTargetError('commande_ligne_id is required.') from exc

        try:
            amount = quantize_amount(contribution['montant_contribue'])
        except (KeyError, TypeError, ValueError, ArithmeticError) as exc:
            raise InvalidPaymentAmountError('montant_contribue is invalid.') from exc

        _ensure_positive_amount(amount)
        normalized_contributions[line_id] = quantize_amount(
            normalized_contributions[line_id] + amount
        )
    return dict(normalized_contributions)


def _get_line_payable_amount(*, line: CommandeLigne) -> Decimal:
    if line.statut == CommandeLigne.Statut.ANNULE:
        return ZERO_AMOUNT
    return quantize_amount(Decimal(line.quantite) * line.prix_unitaire)
