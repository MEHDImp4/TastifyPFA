from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


# Gestion des Ingrédients et des Stocks
# Ce module permet de savoir combien il reste de farine, de tomates, etc.

class Ingredient(models.Model):
    # Unités de mesure pour la cuisine
    UNITE_CHOICES = [
        ('g', 'Grammes'),
        ('ml', 'Millilitres'),
        ('pcs', 'Pièces'),
    ]

    nom = models.CharField(max_length=100, unique=True)
    unite_mesure = models.CharField(max_length=5, choices=UNITE_CHOICES)
    
    # Quantité physique en réserve
    stock_actuel = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    
    # Si le stock descend sous ce seuil, le gérant reçoit une alerte
    seuil_alerte = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    
    est_active = models.BooleanField(default=True) # Soft delete
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ingrédient'
        verbose_name_plural = 'Ingrédients'
        ordering = ['nom']

    def __str__(self):
        return f"{self.nom} ({self.stock_actuel} {self.unite_mesure})"


# Cette classe est la "Recette" : elle lie un plat à ses ingrédients
# Exemple : Le plat "Pizza" a besoin de 200g de l'ingrédient "Farine"
class PlatIngredient(models.Model):
    plat = models.ForeignKey(
        'menu.Plat',
        on_delete=models.CASCADE,
        related_name='plat_ingredients',
    )
    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
        related_name='ingredient_plats',
    )
    # Combien d'ingrédient on consomme pour 1 seul plat commandé
    quantite_requise = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])

    class Meta:
        # On ne peut pas ajouter deux fois le même ingrédient à la même recette
        unique_together = ('plat', 'ingredient')
        verbose_name = 'Ingrédient du plat'
        verbose_name_plural = 'Ingrédients des plats'

    def __str__(self):
        return f"{self.plat} — {self.ingredient} ({self.quantite_requise} {self.ingredient.unite_mesure})"
