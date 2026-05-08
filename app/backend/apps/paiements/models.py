from django.db import models
from django.utils.translation import gettext_lazy as _


class PaiementQuerySet(models.QuerySet):
    def completed(self):
        return self.filter(statut=self.model.Statut.COMPLETE)


class PaiementManager(models.Manager):
    def get_queryset(self):
        return PaiementQuerySet(self.model, using=self._db)

    def completed(self):
        return self.get_queryset().completed()


class Paiement(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', _('En attente')
        COMPLETE = 'COMPLETE', _('Complete')
        ECHOUE = 'ECHOUE', _('Echoue')

    class Methode(models.TextChoices):
        ESPECES = 'ESPECES', _('Especes')
        CARTE = 'CARTE', _('Carte')
        QR = 'QR', _('QR Code')

    commande = models.ForeignKey(
        'commandes.Commande',
        on_delete=models.PROTECT,
        related_name='paiements',
    )
    client = models.ForeignKey(
        'users.Utilisateur',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='paiements',
    )
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    methode = models.CharField(
        max_length=20,
        choices=Methode.choices,
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
        verbose_name = _('Paiement')
        verbose_name_plural = _('Paiements')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['commande', 'statut']),
            models.Index(fields=['reference_transaction']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(montant__gt=0),
                name='paiements_paiement_amount_gt_zero'
            )
        ]

    def __str__(self):
        return f"Paiement {self.pk} - Commande {self.commande_id} ({self.montant})"


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
        verbose_name = _('Item de paiement')
        verbose_name_plural = _('Items de paiement')
        indexes = [
            models.Index(fields=['paiement', 'commande_ligne']),
            models.Index(fields=['commande_ligne']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(montant_contribue__gt=0),
                name='paiements_paiementitem_amount_gt_zero'
            ),
            models.UniqueConstraint(
                fields=['paiement', 'commande_ligne'],
                name='paiements_unique_payment_line_contribution'
            )
        ]

    def __str__(self):
        return f"Item {self.pk} for Line {self.commande_ligne_id}"
