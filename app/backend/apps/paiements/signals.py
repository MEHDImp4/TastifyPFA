from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.paiements.models import Paiement
from apps.paiements.services import reconcile_commande_payment_status
from core.realtime import broadcast_staff_event


@receiver(post_save, sender=Paiement)
def handle_payment_completion(sender, instance, **kwargs):
    """
    Triggers commande status reconciliation when a payment is marked as COMPLETE.
    Table release is handled by apps.commandes.signals.
    """
    if instance.statut == Paiement.Statut.COMPLETE:
        reconcile_commande_payment_status(commande_id=instance.commande_id)

        # Broadcast payment confirmation to staff real-time
        def broadcast():
            broadcast_staff_event("payment_confirmed", {
                "commande_id": instance.commande_id,
                "paiement_id": instance.pk,
                "montant": str(instance.montant),
                "mode": instance.mode
            })
        
        transaction.on_commit(broadcast)
