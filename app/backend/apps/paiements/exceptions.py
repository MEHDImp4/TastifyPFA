class PaiementDomainError(Exception):
    pass


class NoPayableOrderError(PaiementDomainError):
    pass


class AmbiguousPayableOrderError(PaiementDomainError):
    pass


class InvalidSplitConfigurationError(PaiementDomainError):
    pass


class InvalidPaymentAmountError(PaiementDomainError):
    pass


class ContributionTotalMismatchError(PaiementDomainError):
    pass


class InvalidContributionTargetError(PaiementDomainError):
    pass


class LineContributionExceededError(PaiementDomainError):
    pass


class OrderBalanceExceededError(PaiementDomainError):
    pass


class InvalidPaymentTokenError(PaiementDomainError):
    pass


class StalePaymentTokenError(PaiementDomainError):
    pass
