from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.commandes.models import Commande, CommandeLigne
from apps.tables.models import Table


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


@receiver(post_save, sender=Commande)
def sync_table_status(sender, instance, created, **kwargs):
    """
    Automate table status transitions based on order lifecycle.
    """
    table = instance.table
    
    if created:
        # New Order -> Check if it's already terminal
        if instance.statut in [Commande.Statut.PAYEE, Commande.Statut.ANNULEE]:
            if table.statut != Table.Statut.LIBRE:
                table.statut = Table.Statut.LIBRE
                table.save(update_fields=['statut', 'updated_at'])
        else:
            if table.statut != Table.Statut.OCCUPEE:
                table.statut = Table.Statut.OCCUPEE
                table.save(update_fields=['statut', 'updated_at'])
    else:
        # Status change -> Table might become LIBRE
        if instance.statut in [Commande.Statut.PAYEE, Commande.Statut.ANNULEE]:
            if table.statut != Table.Statut.LIBRE:
                table.statut = Table.Statut.LIBRE
                table.save(update_fields=['statut', 'updated_at'])
        elif instance.statut in [Commande.Statut.EN_COURS, Commande.Statut.EN_CUISINE, Commande.Statut.PRETE]:
            # If reactivated or still active -> ensure OCCUPEE
            if table.statut != Table.Statut.OCCUPEE:
                table.statut = Table.Statut.OCCUPEE
                table.save(update_fields=['statut', 'updated_at'])
