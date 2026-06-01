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

    def delete(self, using=None, keep_parents=False):
        """Soft delete: set est_active=False instead of hard deleting."""
        self.est_active = False
        self.save()

    def __str__(self):
        return self.nom


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


class MouvementStock(models.Model):
    TYPE_MOUVEMENT_CHOICES = [
        ('ENTREE', 'Entrée de stock'),
        ('SORTIE', 'Sortie de stock'),
    ]

    SOURCE_CHOICES = [
        ('LIVRAISON', 'Livraison fournisseur'),
        ('ACHAT_PERSONNEL', 'Achat personnel'),
        ('AJUSTEMENT_INVENTAIRE', 'Ajustement inventaire'),
        ('CONSOMMATION_CUISINE', 'Consommation cuisine'),
        ('PERTE', 'Perte / Gaspillage'),
    ]

    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
        related_name='mouvements'
    )
    quantite = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    type_mouvement = models.CharField(max_length=10, choices=TYPE_MOUVEMENT_CHOICES)
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES)
    commentaire = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Mouvement de stock'
        verbose_name_plural = 'Mouvements de stock'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type_mouvement} - {self.ingredient.nom} ({self.quantite} {self.ingredient.unite_mesure})"

    def save(self, *args, **kwargs):
        # Mettre à jour le stock actuel de l'ingrédient lors de la création d'un mouvement
        is_new = self._state.adding
        if is_new:
            if self.type_mouvement == 'ENTREE':
                self.ingredient.stock_actuel += self.quantite
            else:
                self.ingredient.stock_actuel -= self.quantite
            self.ingredient.save()
        super().save(*args, **kwargs)
