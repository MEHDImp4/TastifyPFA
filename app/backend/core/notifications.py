import logging

from django.conf import settings
from django.core.mail import send_mail

from apps.paiements.models import Paiement
from apps.reservations.models import Reservation
from apps.users.models import Utilisateur
from apps.users.reset_tokens import build_password_reset_token, build_password_reset_uid

logger = logging.getLogger(__name__)


def _portal_base_url() -> str:
    return settings.FRONTEND_BASE_URL.rstrip("/")


def _send_transactional_mail(*, subject: str, body: str, recipient: str) -> None:
    try:
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [recipient],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Transactional email delivery failed for %s", recipient)


def send_password_reset_requested_email(*, user: Utilisateur) -> None:
    if not user.email:
        return

    uid = build_password_reset_uid(user)
    token = build_password_reset_token(user)
    reset_url = f"{_portal_base_url()}/reset-password?uid={uid}&token={token}"
    body = (
        f"Bonjour {user.username},\n\n"
        "Une demande de reinitialisation de mot de passe a ete recue.\n"
        f"Utilisez ce lien pour definir un nouveau mot de passe : {reset_url}\n\n"
        f"Ce lien expire au bout de {settings.PASSWORD_RESET_TIMEOUT // 60} minutes.\n"
        "Si vous n'etes pas a l'origine de cette demande, vous pouvez ignorer ce message.\n"
    )
    _send_transactional_mail(
        subject="Tastify | Reinitialisation de mot de passe",
        body=body,
        recipient=user.email,
    )


def send_reservation_confirmation_email(*, reservation: Reservation) -> None:
    user = reservation.client
    if not user.email:
        return

    body = (
        f"Bonjour {user.username},\n\n"
        "Votre reservation Tastify est confirmee.\n"
        f"Date : {reservation.date_reservation}\n"
        f"Heure : {reservation.heure_debut} - {reservation.heure_fin}\n"
        f"Table : {reservation.table.numero}\n"
        f"Personnes : {reservation.nombre_personnes}\n\n"
        "Merci pour votre confiance.\n"
    )
    _send_transactional_mail(
        subject="Tastify | Reservation confirmee",
        body=body,
        recipient=user.email,
    )


def send_payment_confirmation_email(*, paiement: Paiement) -> None:
    user = paiement.client
    if user is None or not user.email:
        return

    body = (
        f"Bonjour {user.username},\n\n"
        "Votre paiement Tastify a ete confirme.\n"
        f"Commande : #{paiement.commande_id}\n"
        f"Montant : {paiement.montant}\n"
        f"Methode : {paiement.methode}\n"
        f"Reference : {paiement.reference_transaction or 'N/A'}\n\n"
        "Merci pour votre visite.\n"
    )
    _send_transactional_mail(
        subject="Tastify | Paiement confirme",
        body=body,
        recipient=user.email,
    )
