import datetime

from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone

from apps.reservations.models import Reservation
from apps.tables.models import Table
from apps.users.models import Utilisateur


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
def test_reservation_creation_sends_confirmation_email(db):
    client = Utilisateur.objects.create_user(
        username='mail_client',
        email='mail_client@tastify.ma',
        password='password123',
        role=Utilisateur.Role.CLIENT,
    )
    table = Table.objects.create(numero=42, capacite=4, statut=Table.Statut.LIBRE)

    with TestCase.captureOnCommitCallbacks(execute=True):
        Reservation.objects.create(
            client=client,
            table=table,
            date_reservation=timezone.localdate() + datetime.timedelta(days=2),
            heure_debut=datetime.time(19, 0),
            heure_fin=datetime.time(20, 30),
            nombre_personnes=2,
        )

    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == [client.email]
    assert 'Reservation confirmee' in mail.outbox[0].subject
