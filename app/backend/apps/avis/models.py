from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Avis(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='avis'
    )
    plat = models.ForeignKey(
        'menu.Plat',
        on_delete=models.CASCADE,
        related_name='avis',
        null=True,
        blank=True
    )
    commande = models.ForeignKey(
        'commandes.Commande',
        on_delete=models.CASCADE,
        related_name='avis',
        null=True,
        blank=True
    )
    commentaire = models.TextField()
    note = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    sentiment_score = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Avis'
        verbose_name_plural = 'Avis'
        ordering = ['-created_at']

    def __str__(self):
        return f"Avis {self.id} by {self.user.username} - Note: {self.note}"
