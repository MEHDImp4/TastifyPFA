import pytest
from apps.paiements.tokens import issue_payment_token, validate_payment_token
from apps.paiements.exceptions import InvalidTokenError


@pytest.mark.django_db
def test_generate_and_validate_token():
    table_id = 1
    commande_id = 100
    
    token = issue_payment_token(table_id, commande_id)
    assert isinstance(token, str)
    
    payload = validate_payment_token(token)
    assert payload["table_id"] == table_id
    assert payload["commande_id"] == commande_id


@pytest.mark.django_db
def test_invalid_signature():
    token = issue_payment_token(1, 100)
    invalid_token = token + "modified"
    
    with pytest.raises(InvalidTokenError):
        validate_payment_token(invalid_token)


@pytest.mark.django_db
def test_expired_token():
    token = issue_payment_token(1, 100)
    
    with pytest.raises(InvalidTokenError):
        validate_payment_token(token, max_age=-1)
