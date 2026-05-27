from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.paiements.models import Paiement
from apps.loyalty.models import LoyaltyProfile, LoyaltyTransaction
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Paiement)
def award_points(sender, instance, **kwargs):
    """
    Awards loyalty points when a payment is marked as COMPLETE and linked to a client.
    Points conversion: 1 point per 10 MAD/DH.
    """
    # Defensive check: only trigger if status is COMPLETE and a client is present
    if instance.statut == Paiement.Statut.COMPLETE and instance.client:
        
        # Check if points were already awarded for this specific payment to prevent duplicates
        transaction_exists = LoyaltyTransaction.objects.filter(
            description__icontains=f"paiement {instance.pk}"
        ).exists()
        
        if transaction_exists:
            return

        # 1 point for every 10 DH/EUR spent
        points_to_award = instance.montant / Decimal('10.00')
        
        if points_to_award > 0:
            try:
                profile, _ = LoyaltyProfile.objects.get_or_create(user=instance.client)
                
                # Create the points gain transaction
                LoyaltyTransaction.objects.create(
                    profile=profile,
                    points=points_to_award,
                    type=LoyaltyTransaction.Type.GAIN,
                    description=f"Points gagnés pour le paiement {instance.pk}"
                )
                
                # Increment the total profile points
                profile.points += points_to_award
                profile.save(update_fields=['points', 'updated_at'])
                
                logger.info(f"Loyalty: Awarded {points_to_award} points to {instance.client.username} for payment {instance.pk}")
            except Exception as e:
                logger.error(f"Loyalty: Failed to award points for payment {instance.pk}: {str(e)}")
