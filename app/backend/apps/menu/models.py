# Ce fichier définit les données de la carte du restaurant (Menu)
# Django transforme ces classes Python en tables SQL dans la base de données.

from django.db import models

# Les QuerySets et Managers permettent de créer des raccourcis pour filtrer les données
# Exemple : Categorie.objects.active() au lieu de Categorie.objects.filter(est_active=True)
class CategorieQuerySet(models.QuerySet):
    def active(self):
        return self.filter(est_active=True)

class CategorieManager(models.Manager):
    def get_queryset(self):
        return CategorieQuerySet(self.model, using=self._db)
    def active(self):
        return self.get_queryset().active()

# La classe Categorie représente un groupe de plats (ex: Entrées, Plats, Desserts)
class Categorie(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    ordre_affichage = models.PositiveIntegerField(default=0) # Pour trier l'affichage sur la tablette
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    est_active = models.BooleanField(default=True) # Pour cacher une catégorie sans la supprimer
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CategorieManager()

    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering = ['ordre_affichage', 'nom']

    def __str__(self):
        # Cette méthode définit comment la catégorie s'affiche dans l'admin (son nom)
        return self.nom

    def delete(self, using=None, keep_parents=False):
        # "Soft delete" : au lieu de supprimer la ligne en base de données,
        # on marque juste 'est_active=False'. C'est plus sûr pour l'historique des commandes.
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

# La classe Plat représente un plat individuel du menu
class Plat(models.Model):
    # Relation "Un-à-Plusieurs" : un plat appartient à une seule catégorie
    categorie = models.ForeignKey(
        'Categorie',
        on_delete=models.CASCADE,
        related_name='plats',
    )
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    prix = models.DecimalField(max_digits=10, decimal_places=2)
    temps_preparation = models.IntegerField(default=15) # Temps estimé en minutes
    image = models.ImageField(upload_to='plats/', blank=True, null=True)
    est_disponible = models.BooleanField(default=True) # Ex: "Rupture de stock" temporaire
    est_active = models.BooleanField(default=True) # Ex: "Supprimé de la carte" définitivement
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Relation "Plusieurs-à-Plusieurs" : un plat a plusieurs ingrédients,
    # et un ingrédient peut être utilisé dans plusieurs plats.
    ingredients = models.ManyToManyField(
        'stock.Ingredient',
        through='stock.PlatIngredient', # Table intermédiaire pour gérer les quantités
        related_name='plats',
        blank=True,
    )

    objects = PlatManager()

    class Meta:
        verbose_name = 'Plat'
        verbose_name_plural = 'Plats'
        ordering = ['categorie', 'nom']

    def __str__(self):
        return self.nom

    def delete(self, using=None, keep_parents=False):
        # Même principe de Soft Delete que pour la catégorie
        self.est_active = False
        self.save(update_fields=['est_active', 'updated_at'])
