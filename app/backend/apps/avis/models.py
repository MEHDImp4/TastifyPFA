from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


# Gestion des Avis et Commentaires Clients
# Ce module permet de récolter les avis et d'analyser le sentiment (IA).

class Avis(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='avis'
    )
    # L'avis peut être lié à un plat spécifique...
    plat = models.ForeignKey(
        'menu.Plat',
        on_delete=models.CASCADE,
        related_name='avis',
        null=True,
        blank=True
    )
    # ...ou à une commande globale
    commande = models.ForeignKey(
        'commandes.Commande',
        on_delete=models.CASCADE,
        related_name='avis',
        null=True,
        blank=True
    )
    commentaire = models.TextField()
    note = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    
    # Stockage temporaire pour le score d'analyse
    sentiment_score = models.IntegerField(null=True, blank=True)
    lang_code = models.CharField(max_length=10, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Avis'
        verbose_name_plural = 'Avis'
        ordering = ['-created_at']

    def __str__(self):
        return f"Avis {self.id} by {self.user.username} - Note: {self.note}"


# Cette classe stocke le résultat de l'analyse automatique par l'IA (BERT)
class AnalyseSentiment(models.Model):
    class Label(models.TextChoices):
        POSITIF = 'POSITIF', 'Positif'
        NEGATIF = 'NEGATIF', 'Négatif'
        NEUTRE  = 'NEUTRE',  'Neutre'

    # Relation Un-à-Un : Chaque avis a UNE seule analyse de sentiment
    avis           = models.OneToOneField(Avis, on_delete=models.CASCADE, related_name='analyse')
    label          = models.CharField(max_length=10, choices=Label.choices)
    score_brut     = models.FloatField() # Force du sentiment (ex: 0.98 pour très positif)
    modele_utilise = models.CharField(max_length=100) # Nom de l'IA utilisée
    date_analyse   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Analyse de sentiment'
        verbose_name_plural = 'Analyses de sentiment'

    def __str__(self):
        return f"Analyse #{self.avis_id} → {self.label} ({self.score_brut:.2f})"
