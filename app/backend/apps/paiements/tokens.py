from __future__ import annotations

from django.core import signing


PAYMENT_TOKEN_SALT = "apps.paiements.payment"


def issue_payment_token(*, table_id: int, commande_id: int) -> str:
    return signing.dumps(
        {"table_id": table_id, "commande_id": commande_id},
        salt=PAYMENT_TOKEN_SALT,
    )
