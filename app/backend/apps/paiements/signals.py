from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.paiements.models import Paiement
from apps.paiements.services import reconcile_commande_payment_status


@receiver(post_save, sender=Paiement)
def handle_payment_completion(sender, instance, **kwargs):
    """
    Triggers commande status reconciliation when a payment is marked as COMPLETE.
    Table release is handled by apps.commandes.signals.
    """
    if instance.statut == Paiement.Statut.COMPLETE:
        reconcile_commande_payment_status(commande_id=instance.commande_id)
