from decimal import Decimal

from django.core import mail
from django.test import TestCase, override_settings

from apps.commandes.models import Commande
from apps.paiements.models import Paiement
from apps.tables.models import Table
from apps.users.models import Utilisateur


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
def test_completed_payment_sends_confirmation_email(db):
    client = Utilisateur.objects.create_user(
        username='paid_client',
        email='paid_client@tastify.ma',
        password='password123',
        role=Utilisateur.Role.CLIENT,
    )
    table = Table.objects.create(numero=9, capacite=4, statut=Table.Statut.OCCUPEE)
    commande = Commande.objects.create(
        table=table,
        type=Commande.Type.SUR_PLACE,
        statut=Commande.Statut.EN_COURS,
        montant_total=Decimal('120.00'),
    )

    with TestCase.captureOnCommitCallbacks(execute=True):
        Paiement.objects.create(
            commande=commande,
            client=client,
            montant=Decimal('120.00'),
            methode=Paiement.Methode.QR,
            statut=Paiement.Statut.COMPLETE,
            reference_transaction='txn-123',
        )

    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == [client.email]
    assert 'Paiement confirme' in mail.outbox[0].subject
