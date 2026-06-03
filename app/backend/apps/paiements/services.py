from decimal import Decimal, ROUND_HALF_UP

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


class PayableSession:
    """Objet simple qui décrit ce qui reste à payer pour une table."""

    def __init__(self, table_id, commande_id, montant_total, montant_paye, montant_restant, items):
        self.table_id = table_id
        self.commande_id = commande_id
        self.montant_total = montant_total
        self.montant_paye = montant_paye
        self.montant_restant = montant_restant
        self.items = items


class EqualSplitPreview:
    """Objet simple utilisé pour afficher le partage égal de l'addition."""

    def __init__(self, commande_id, total_amount, share_count, share_amounts):
        self.commande_id = commande_id
        self.total_amount = total_amount
        self.share_count = share_count
        self.share_amounts = share_amounts


class ContributionPreview:
    """Objet simple qui décrit combien une ligne de commande reçoit comme paiement."""

    def __init__(self, commande_ligne_id, montant_contribue, montant_deja_couvert, montant_restant_ligne):
        self.commande_ligne_id = commande_ligne_id
        self.montant_contribue = montant_contribue
        self.montant_deja_couvert = montant_deja_couvert
        self.montant_restant_ligne = montant_restant_ligne


class ItemContributionValidation:
    """Résultat de validation d'un paiement par articles."""

    def __init__(self, commande_id, total_amount, contributions):
        self.commande_id = commande_id
        self.total_amount = total_amount
        self.contributions = contributions


def quantize_amount(value):
    """Arrondit un montant comme un prix: toujours deux chiffres après la virgule."""
    return Decimal(value).quantize(CURRENCY_QUANTUM, rounding=ROUND_HALF_UP)


def get_completed_paid_total(commande_id):
    return _aggregate_completed_payment_total(commande_id)


def resolve_payable_session(table_id):
    """
    Trouve la commande active d'une table et calcule le reste à payer.
    Une table ne doit avoir qu'une seule commande payable à la fois.
    """
    with transaction.atomic():
        commandes = list(
            Commande.objects.select_for_update()
            .filter(
                table_id=table_id,
                est_active=True,
                statut__in=PAYABLE_COMMANDE_STATUSES,
            )
            .order_by('id')
        )

        sessions_payables = []
        for commande in commandes:
            montant_paye = _aggregate_completed_payment_total(commande.id)
            montant_restant = quantize_amount(commande.montant_total - montant_paye)

            if montant_restant > ZERO_AMOUNT:
                items = _build_payment_items(commande)
                sessions_payables.append(
                    PayableSession(
                        table_id=table_id,
                        commande_id=commande.id,
                        montant_total=quantize_amount(commande.montant_total),
                        montant_paye=montant_paye,
                        montant_restant=montant_restant,
                        items=items,
                    )
                )

        if len(sessions_payables) == 0:
            raise NoPayableOrderError(f'Aucune commande payable pour la table {table_id}.')
        if len(sessions_payables) > 1:
            raise AmbiguousPayableOrderError(
                f'Plusieurs commandes payables pour la table {table_id}.'
            )

        return sessions_payables[0]


def calculate_equal_split_shares(total_amount, share_count):
    """Partage un montant en parts presque égales."""
    if share_count <= 0:
        raise InvalidSplitConfigurationError('Le nombre de parts doit etre superieur a zero.')

    total_amount = quantize_amount(total_amount)
    if share_count == 1:
        return (total_amount,)

    base_share = quantize_amount(total_amount / share_count)
    share_amounts = []

    for _ in range(share_count - 1):
        share_amounts.append(base_share)

    # La dernière personne absorbe les centimes dus à l'arrondi.
    already_allocated = base_share * (share_count - 1)
    share_amounts.append(quantize_amount(total_amount - already_allocated))
    return tuple(share_amounts)


def preview_equal_split_for_table(table_id, share_count):
    session = resolve_payable_session(table_id)
    return EqualSplitPreview(
        commande_id=session.commande_id,
        total_amount=session.montant_restant,
        share_count=share_count,
        share_amounts=calculate_equal_split_shares(session.montant_restant, share_count),
    )


def validate_item_contributions(commande_id, contributions):
    """Vérifie un paiement où chaque personne paie certains plats."""
    with transaction.atomic():
        commande = _lock_commande_for_payment(commande_id)
        return _validate_item_contributions_locked(commande, contributions)


def create_payment(
    commande_id,
    montant,
    methode,
    statut=Paiement.Statut.EN_ATTENTE,
    reference_transaction='',
    contributions=None,
    client=None,
):
    """Crée un paiement et marque la commande payée si le total est atteint."""
    if contributions is None:
        contributions = []

    with transaction.atomic():
        commande = _lock_commande_for_payment(commande_id)
        montant = quantize_amount(montant)
        _ensure_positive_amount(montant)

        reste_a_payer = _get_remaining_balance_locked(commande)
        if montant > reste_a_payer:
            raise OrderBalanceExceededError('Le paiement depasse le reste a payer.')

        validation = None
        if contributions:
            validation = _validate_item_contributions_locked(commande, contributions)
            if validation.total_amount != montant:
                raise ContributionTotalMismatchError(
                    'La somme des contributions doit correspondre au montant paye.'
                )

        paiement = Paiement.objects.create(
            commande=commande,
            client=client,
            montant=montant,
            methode=methode,
            statut=statut,
            reference_transaction=reference_transaction,
        )

        # Si le client paie par QR code, on garde son compte lié à la commande.
        if client is not None and commande.client is None:
            commande.client = client
            commande.save(update_fields=['client', 'updated_at'])

        if validation is not None:
            for contribution in validation.contributions:
                PaiementItem.objects.create(
                    paiement=paiement,
                    commande_ligne_id=contribution.commande_ligne_id,
                    montant_contribue=contribution.montant_contribue,
                )

        if statut == Paiement.Statut.COMPLETE:
            reconcile_commande_payment_status(commande.id)

        return paiement


def complete_payment(paiement_id, reference_transaction=None):
    """Passe un paiement en COMPLETE."""
    with transaction.atomic():
        paiement = Paiement.objects.select_for_update().select_related('commande').get(pk=paiement_id)
        if paiement.statut == Paiement.Statut.COMPLETE:
            return paiement

        commande = _lock_commande_for_payment(paiement.commande_id)
        reste_a_payer = _get_remaining_balance_locked(commande)
        if quantize_amount(paiement.montant) > reste_a_payer:
            raise OrderBalanceExceededError('Le paiement depasse le reste a payer.')

        paiement.statut = Paiement.Statut.COMPLETE
        champs_modifies = ['statut', 'updated_at']
        if reference_transaction is not None:
            paiement.reference_transaction = reference_transaction
            champs_modifies.append('reference_transaction')

        paiement.save(update_fields=champs_modifies)
        reconcile_commande_payment_status(commande.id)
        return paiement


def reconcile_commande_payment_status(commande_id):
    """Met la commande en PAYEE quand les paiements complets couvrent tout le total."""
    with transaction.atomic():
        commande = Commande.objects.select_for_update().get(pk=commande_id)
        if not commande.est_active or commande.statut == Commande.Statut.ANNULEE:
            return commande

        montant_paye = _aggregate_completed_payment_total(commande.id)
        total_commande = quantize_amount(commande.montant_total)
        if montant_paye >= total_commande and commande.statut != Commande.Statut.PAYEE:
            commande.statut = Commande.Statut.PAYEE
            commande.save(update_fields=['statut', 'updated_at'])

        return commande


def _build_payment_items(commande):
    """Prépare la liste des plats affichés sur l'écran de paiement."""
    lignes = CommandeLigne.objects.filter(commande=commande).select_related('plat').order_by('id')
    contributions_existantes = _get_existing_contributions_for_commande(commande)
    items = []

    for ligne in lignes:
        total_ligne = quantize_amount(ligne.quantite * ligne.prix_unitaire)
        deja_paye = contributions_existantes.get(ligne.id, ZERO_AMOUNT)
        items.append(
            {
                'id': ligne.id,
                'plat_nom': ligne.plat.nom,
                'quantite': ligne.quantite,
                'prix_unitaire': quantize_amount(ligne.prix_unitaire),
                'total': total_ligne,
                'deja_paye': deja_paye,
                'reste_a_payer': quantize_amount(total_ligne - deja_paye),
            }
        )

    return items


def _get_existing_contributions_for_commande(commande):
    rows = (
        PaiementItem.objects.filter(
            commande_ligne__commande=commande,
            paiement__statut=Paiement.Statut.COMPLETE,
        )
        .values('commande_ligne')
        .annotate(total=Sum('montant_contribue'))
    )

    contributions = {}
    for row in rows:
        contributions[row['commande_ligne']] = quantize_amount(row['total'])
    return contributions


def _aggregate_completed_payment_total(commande_id):
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


def _lock_commande_for_payment(commande_id):
    commande = Commande.objects.select_for_update().filter(pk=commande_id).first()
    if commande is None:
        raise NoPayableOrderError(f'La commande {commande_id} n existe pas.')
    if not commande.est_active or commande.statut not in PAYABLE_COMMANDE_STATUSES:
        raise NoPayableOrderError(f'La commande {commande_id} n est pas payable.')
    return commande


def _ensure_positive_amount(amount):
    if amount <= ZERO_AMOUNT:
        raise InvalidPaymentAmountError('Le montant doit etre superieur a zero.')


def _get_remaining_balance_locked(commande):
    montant_paye = _aggregate_completed_payment_total(commande.id)
    return quantize_amount(commande.montant_total - montant_paye)


def _validate_item_contributions_locked(commande, contributions):
    contributions_normalisees = _normalize_contributions(contributions)
    if not contributions_normalisees:
        raise InvalidSplitConfigurationError('Au moins une contribution est requise.')

    lignes = list(
        CommandeLigne.objects.select_for_update()
        .filter(commande_id=commande.id, pk__in=contributions_normalisees.keys())
        .order_by('id')
    )

    if len(lignes) != len(contributions_normalisees):
        raise InvalidContributionTargetError('Une ligne de commande est invalide.')

    contributions_existantes = _get_existing_contributions_for_lines(contributions_normalisees.keys())
    resultats = []
    total = ZERO_AMOUNT

    for ligne in lignes:
        montant_demande = contributions_normalisees[ligne.id]
        montant_ligne = _get_line_payable_amount(ligne)
        montant_deja_paye = contributions_existantes.get(ligne.id, ZERO_AMOUNT)
        montant_apres_paiement = quantize_amount(montant_deja_paye + montant_demande)

        if montant_apres_paiement > montant_ligne:
            raise LineContributionExceededError(
                f'La contribution depasse le prix de la ligne {ligne.id}.'
            )

        resultats.append(
            ContributionPreview(
                commande_ligne_id=ligne.id,
                montant_contribue=montant_demande,
                montant_deja_couvert=montant_deja_paye,
                montant_restant_ligne=quantize_amount(montant_ligne - montant_apres_paiement),
            )
        )
        total = quantize_amount(total + montant_demande)

    reste_a_payer = _get_remaining_balance_locked(commande)
    if total > reste_a_payer:
        raise OrderBalanceExceededError('La contribution depasse le reste a payer.')

    return ItemContributionValidation(
        commande_id=commande.id,
        total_amount=total,
        contributions=tuple(resultats),
    )


def _normalize_contributions(contributions):
    """Transforme la liste recue en dictionnaire: {ligne_id: montant_total}."""
    resultats = {}

    for contribution in contributions:
        try:
            ligne_id = int(contribution['commande_ligne_id'])
            montant = quantize_amount(contribution['montant_contribue'])
        except (KeyError, TypeError, ValueError, ArithmeticError) as exc:
            raise InvalidContributionTargetError('Contribution invalide.') from exc

        _ensure_positive_amount(montant)
        ancien_montant = resultats.get(ligne_id, ZERO_AMOUNT)
        resultats[ligne_id] = quantize_amount(ancien_montant + montant)

    return resultats


def _get_existing_contributions_for_lines(line_ids):
    rows = (
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

    contributions = {}
    for row in rows:
        contributions[row['commande_ligne']] = quantize_amount(row['total'])
    return contributions


def _get_line_payable_amount(ligne):
    if ligne.statut == CommandeLigne.Statut.ANNULE:
        return ZERO_AMOUNT
    return quantize_amount(Decimal(ligne.quantite) * ligne.prix_unitaire)
