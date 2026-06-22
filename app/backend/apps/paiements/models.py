from decimal import Decimal
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator


class PaiementQuerySet(models.QuerySet):
    def completed(self):
        return self.filter(statut=self.model.Statut.COMPLETE)


class PaiementManager(models.Manager):
    def get_queryset(self):
        return PaiementQuerySet(self.model, using=self._db)

    def completed(self):
        return self.get_queryset().completed()


# Gestion des Encaissements et Paiements
# Ce module supporte le paiement total ou partiel (split-bill).

class Paiement(models.Model):
    # Les états du paiement
    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', _('En attente') # En attente du feu vert de la banque/serveur
        COMPLETE = 'COMPLETE', _('Complété')       # L'argent est encaissé
        ECHOUE = 'ECHOUE', _('Échoué')

    class Methode(models.TextChoices):
        ESPECES = 'ESPECES', _('Espèces') # Cash
        CARTE = 'CARTE', _('Carte')       # TPE classique
        QR = 'QR', _('QR Code')           # Paiement digital mobile

    commande = models.ForeignKey(
        'commandes.Commande',
        on_delete=models.PROTECT,
        related_name='paiements',
    )
    # L'utilisateur qui paye (facultatif si c'est un client de passage)
    client = models.ForeignKey(
        'users.Utilisateur',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='paiements',
    )
    montant = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    methode = models.CharField(
        max_length=20,
        choices=Methode.choices,
    )
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
        db_index=True,
    )
    # ID unique venant du processeur de paiement (Stripe, etc.)
    reference_transaction = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    objects = PaiementManager()

    class Meta:
        verbose_name = _('Paiement')
        verbose_name_plural = _('Paiements')
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(montant__gt=0),
                name='paiements_paiement_amount_gt_zero'
            )
        ]

    def __str__(self):
        return f"Paiement {self.pk} - Commande {self.commande_id} ({self.montant}€)"


# Cette classe gère le "Détail" du paiement
# Très important pour le split-bill : on peut dire que CE paiement couvre
# CE plat spécifique de la commande.
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
    # Montant payé pour cette ligne spécifique
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
                condition=models.Q(montant_contribue__gt=0),
                name='paiements_paiementitem_amount_gt_zero'
            ),
            models.UniqueConstraint(
                fields=['paiement', 'commande_ligne'],
                name='paiements_unique_payment_line_contribution'
            )
        ]

    def __str__(self):
        return f"Item {self.pk} for Line {self.commande_ligne_id}"
