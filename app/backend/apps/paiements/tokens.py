from django.core import signing
from django.conf import settings
from .exceptions import InvalidTokenError

# Salt for the payment tokens
PAYMENT_TOKEN_SALT = "tastify.paiements.qr_token"

# Default max age for tokens (e.g., 4 hours)
DEFAULT_MAX_AGE = 60 * 60 * 4


def issue_payment_token(table_id, commande_id):
    """
    Generates a signed token for a specific table and order.
    """
    payload = {
        "table_id": table_id,
        "commande_id": commande_id,
    }
    return signing.dumps(payload, salt=PAYMENT_TOKEN_SALT)


def validate_payment_token(token, max_age=DEFAULT_MAX_AGE):
    """
    Validates a payment token and returns the payload.
    Raises InvalidTokenError if signature is invalid or expired.
    """
    try:
        payload = signing.loads(
            token,
            salt=PAYMENT_TOKEN_SALT,
            max_age=max_age
        )
        return payload
    except (signing.BadSignature, signing.SignatureExpired):
        raise InvalidTokenError()
