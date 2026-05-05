from django.db import models


class Ingredient(models.Model):
    UNITE_CHOICES = [
        ('g', 'Grammes'),
        ('ml', 'Millilitres'),
        ('pcs', 'Pièces'),
    ]

    nom = models.CharField(max_length=100, unique=True)
    unite_mesure = models.CharField(max_length=5, choices=UNITE_CHOICES)
    stock_actuel = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    seuil_alerte = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    est_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ingrédient'
        verbose_name_plural = 'Ingrédients'
        ordering = ['nom']

    def __str__(self):
        return self.nom

    def delete(self, using=None, keep_parents=False):
        """Soft delete: marks inactive instead of removing the DB row."""
        self.est_active = False
        self.save(update_fields=['est_active', 'updated_at'])


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
    quantite_requise = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ('plat', 'ingredient')
        verbose_name = 'Ingrédient du plat'
        verbose_name_plural = 'Ingrédients des plats'

    def __str__(self):
        return f"{self.plat} — {self.ingredient} ({self.quantite_requise} {self.ingredient.unite_mesure})"
