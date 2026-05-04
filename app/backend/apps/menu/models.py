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


class PlatQuerySet(models.QuerySet):
    def active(self):
        return self.filter(est_active=True)


class PlatManager(models.Manager):
    def get_queryset(self):
        return PlatQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()


class Plat(models.Model):
    categorie = models.ForeignKey(
        'Categorie',
        on_delete=models.CASCADE,
        related_name='plats',
    )
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    prix = models.DecimalField(max_digits=10, decimal_places=2)
    temps_preparation = models.IntegerField(default=15)
    image = models.ImageField(upload_to='plats/', blank=True, null=True)
    est_disponible = models.BooleanField(default=True)
    est_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PlatManager()

    class Meta:
        verbose_name = 'Plat'
        verbose_name_plural = 'Plats'
        ordering = ['categorie', 'nom']

    def __str__(self):
        return self.nom

    def delete(self, using=None, keep_parents=False):
        self.est_active = False
        self.save(update_fields=['est_active', 'updated_at'])
