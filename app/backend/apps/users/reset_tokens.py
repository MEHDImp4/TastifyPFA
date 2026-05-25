from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from apps.users.models import Utilisateur


def build_password_reset_uid(user: Utilisateur) -> str:
    return urlsafe_base64_encode(force_bytes(user.pk))


def build_password_reset_token(user: Utilisateur) -> str:
    return default_token_generator.make_token(user)


def resolve_password_reset_user(uid: str) -> Utilisateur | None:
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        return Utilisateur.objects.filter(pk=user_id, is_active=True).first()
    except (TypeError, ValueError, OverflowError):
        return None


def is_valid_password_reset_token(*, user: Utilisateur | None, token: str) -> bool:
    if user is None:
        return False
    return default_token_generator.check_token(user, token)
