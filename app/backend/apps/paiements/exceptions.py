from rest_framework import status
from rest_framework.exceptions import APIException


class PaiementError(APIException):
    """Base exception for paiement-related errors."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Une erreur est survenue lors du paiement."
    default_code = "paiement_error"


class NoPayableOrderError(PaiementError):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Aucune commande à payer pour cette table."
    default_code = "no_payable_order"


class AmbiguousPayableOrderError(PaiementError):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Plusieurs commandes payables trouvées pour cette table."
    default_code = "ambiguous_payable_order"


class InvalidTokenError(PaiementError):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "Jeton de paiement invalide ou expiré."
    default_code = "invalid_payment_token"


class ContributionTotalMismatchError(PaiementError):
    default_detail = "Le total des contributions ne correspond pas au montant du paiement."
    default_code = "contribution_total_mismatch"


class InvalidContributionTargetError(PaiementError):
    default_detail = "Cible de contribution invalide."
    default_code = "invalid_contribution_target"


class InvalidPaymentAmountError(PaiementError):
    default_detail = "Montant de paiement invalide."
    default_code = "invalid_payment_amount"


class InvalidSplitConfigurationError(PaiementError):
    default_detail = "Configuration de division invalide."
    default_code = "invalid_split_configuration"


class LineContributionExceededError(PaiementError):
    default_detail = "La contribution dépasse le montant restant pour cette ligne."
    default_code = "line_contribution_exceeded"


class OrderBalanceExceededError(PaiementError):
    default_detail = "Le paiement dépasse le solde restant de la commande."
    default_code = "order_balance_exceeded"
