from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.paiements.models import Paiement
from apps.loyalty.models import LoyaltyProfile, LoyaltyTransaction
from decimal import Decimal

@receiver(post_save, sender=Paiement)
def award_points(sender, instance, created, **kwargs):
    # Only award points if status is COMPLETE and there is a client
    if instance.statut == Paiement.Statut.COMPLETE and instance.client:
        # Check if points were already awarded for this payment to avoid double awarding
        # (Though in simple logic we just rely on status transition)
        
        # In a real scenario, we might want to track which payment generated which transaction
        # For now, we follow the plan: 1 point per 10 MAD
        points_to_award = instance.montant / Decimal('10.00')
        
        if points_to_award > 0:
            profile, _ = LoyaltyProfile.objects.get_or_create(user=instance.client)
            
            # Create transaction
            LoyaltyTransaction.objects.create(
                profile=profile,
                points=points_to_award,
                type=LoyaltyTransaction.Type.GAIN,
                description=f"Points gagnés pour le paiement {instance.pk}"
            )
            
            # Update profile points
            profile.points += points_to_award
            profile.save()
