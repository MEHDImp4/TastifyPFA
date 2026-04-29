from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.commandes.models import CommandeLigne


def recalcul_montant_total(commande):
    total = commande.lignes.exclude(statut=CommandeLigne.Statut.ANNULE).aggregate(
        total=Sum(
            ExpressionWrapper(
                F('quantite') * F('prix_unitaire'),
                output_field=DecimalField(max_digits=10, decimal_places=2),
            )
        )
    )['total'] or 0
    commande.montant_total = total
    commande.save(update_fields=['montant_total', 'updated_at'])


@receiver(post_save, sender=CommandeLigne)
def update_total_on_ligne_save(sender, instance, **kwargs):
    recalcul_montant_total(instance.commande)


@receiver(post_delete, sender=CommandeLigne)
def update_total_on_ligne_delete(sender, instance, **kwargs):
    recalcul_montant_total(instance.commande)
