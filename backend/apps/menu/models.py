from django.db import models


class CategorieQuerySet(models.QuerySet):
    def active(self):
        return self.filter(est_active=True)


class CategorieManager(models.Manager):
    def get_queryset(self):
        return CategorieQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()


class Categorie(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    ordre_affichage = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    est_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CategorieManager()

    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering = ['ordre_affichage', 'nom']

    def __str__(self):
        return self.nom

    def delete(self, using=None, keep_parents=False):
        """Soft delete: marks inactive instead of removing the DB row (per D-07)."""
        self.est_active = False
        self.save(update_fields=['est_active', 'updated_at'])
