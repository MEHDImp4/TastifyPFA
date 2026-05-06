from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.paiements.models import Paiement
from apps.paiements.services import reconcile_commande_payment_status


@receiver(post_save, sender=Paiement)
def reconcile_commande_after_completed_payment(sender, instance, **kwargs):
    if instance.statut != Paiement.Statut.COMPLETE:
        return
    reconcile_commande_payment_status(commande_id=instance.commande_id)

