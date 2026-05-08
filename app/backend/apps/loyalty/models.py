from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from decimal import Decimal

class LoyaltyProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='loyalty_profile'
    )
    points = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def tier(self):
        if self.points < 500:
            return 'BRONZE'
        elif self.points < 1500:
            return 'SILVER'
        else:
            return 'GOLD'

    class Meta:
        verbose_name = _('Profil de fidélité')
        verbose_name_plural = _('Profils de fidélité')

    def __str__(self):
        return f"Loyalty: {self.user.username} ({self.points} pts)"


class LoyaltyTransaction(models.Model):
    class Type(models.TextChoices):
        GAIN = 'GAIN', _('Gain')
        DEPENSE = 'DEPENSE', _('Dépense')

    profile = models.ForeignKey(
        LoyaltyProfile,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    points = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=Type.choices)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Transaction de fidélité')
        verbose_name_plural = _('Transactions de fidélité')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} {self.points} for {self.profile.user.username}"


class Reward(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    points_requis = models.DecimalField(max_digits=10, decimal_places=2)
    est_actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Récompense')
        verbose_name_plural = _('Récompenses')

    def __str__(self):
        return f"{self.nom} ({self.points_requis} pts)"
