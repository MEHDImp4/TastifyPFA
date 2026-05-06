from django.db import models

from apps.paiements.constants import (
    PAYMENT_METHOD_CARTE,
    PAYMENT_METHOD_EN_LIGNE,
    PAYMENT_METHOD_ESPECES,
    PAYMENT_STATUS_COMPLETE,
    PAYMENT_STATUS_ECHOUE,
    PAYMENT_STATUS_EN_ATTENTE,
)


class PaiementQuerySet(models.QuerySet):
    def completed(self):
        return self.filter(statut=Paiement.Statut.COMPLETE)


class PaiementManager(models.Manager):
    def get_queryset(self):
        return PaiementQuerySet(self.model, using=self._db)

    def completed(self):
        return self.get_queryset().completed()


class Paiement(models.Model):
    class Methode(models.TextChoices):
        CARTE = PAYMENT_METHOD_CARTE, 'Carte'
        ESPECES = PAYMENT_METHOD_ESPECES, 'Especes'
        EN_LIGNE = PAYMENT_METHOD_EN_LIGNE, 'En ligne'

    class Statut(models.TextChoices):
        EN_ATTENTE = PAYMENT_STATUS_EN_ATTENTE, 'En attente'
        COMPLETE = PAYMENT_STATUS_COMPLETE, 'Complete'
        ECHOUE = PAYMENT_STATUS_ECHOUE, 'Echoue'

    commande = models.ForeignKey(
        'commandes.Commande',
        on_delete=models.PROTECT,
        related_name='paiements',
    )
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    methode = models.CharField(
        max_length=20,
        choices=Methode.choices,
        default=Methode.CARTE,
    )
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
    )
    reference_transaction = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PaiementManager()

    class Meta:
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['created_at', 'id']
        indexes = [
            models.Index(fields=['commande', 'statut', 'created_at']),
            models.Index(fields=['statut', 'methode']),
            models.Index(fields=['reference_transaction']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(montant__gt=0),
                name='paiements_paiement_amount_gt_zero',
            ),
        ]

    def __str__(self):
        return f'Paiement #{self.pk} - Commande {self.commande_id}'


class PaiementItem(models.Model):
    paiement = models.ForeignKey(
        Paiement,
        on_delete=models.CASCADE,
        related_name='items',
    )
    commande_ligne = models.ForeignKey(
        'commandes.CommandeLigne',
        on_delete=models.PROTECT,
        related_name='paiement_items',
    )
    montant_contribue = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = 'Contribution de paiement'
        verbose_name_plural = 'Contributions de paiement'
        ordering = ['id']
        indexes = [
            models.Index(fields=['commande_ligne']),
            models.Index(fields=['paiement', 'commande_ligne']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(montant_contribue__gt=0),
                name='paiements_paiementitem_amount_gt_zero',
            ),
            models.UniqueConstraint(
                fields=['paiement', 'commande_ligne'],
                name='paiements_unique_payment_line_contribution',
            ),
        ]

    def __str__(self):
        return f'PaiementItem #{self.pk} - Ligne {self.commande_ligne_id}'

