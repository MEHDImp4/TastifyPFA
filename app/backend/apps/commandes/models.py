from django.conf import settings
from django.db import models


class CommandeQuerySet(models.QuerySet):
    def active(self):
        return self.filter(est_active=True)


class CommandeManager(models.Manager):
    def get_queryset(self):
        return CommandeQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()


# Ce fichier est le plus important pour la logique du restaurant.
# Il gère les Commandes (le ticket global) et les Lignes (chaque plat sur le ticket).

class Commande(models.Model):
    # Les différentes étapes de vie d'une commande
    class Statut(models.TextChoices):
        EN_COURS = 'EN_COURS', 'En cours'     # Le serveur est en train de prendre la commande
        EN_CUISINE = 'EN_CUISINE', 'En cuisine' # Envoyée aux cuisiniers
        PRETE = 'PRETE', 'Prête'             # Les plats sont prêts à être servis
        PAYEE = 'PAYEE', 'Payée'             # La commande est terminée et encaissée
        ANNULEE = 'ANNULEE', 'Annulée'

    class Type(models.TextChoices):
        SUR_PLACE = 'SUR_PLACE', 'Sur place'
        EMPORTER = 'EMPORTER', 'À emporter'

    # Liaison avec la table (si c'est sur place)
    table = models.ForeignKey(
        'tables.Table',
        on_delete=models.PROTECT,
        related_name='commandes',
        null=True,
        blank=True,
    )
    # Liaison avec l'employé qui a pris la commande
    serveur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='commandes_prises',
        null=True,
        blank=True,
    )
    # Liaison avec le client authentifié (pour historique et avis)
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='mes_commandes',
        null=True,
        blank=True,
    )
    type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.SUR_PLACE,
    )
    client_nom = models.CharField(max_length=100, blank=True, null=True)
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_COURS,
    )
    # Montant total calculé automatiquement à partir des lignes
    montant_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    est_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CommandeManager()

    class Meta:
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-created_at']

    def __str__(self):
        # Affiche un résumé simple pour l'étudiant/admin
        return f'Commande #{self.pk} - Table {self.table_id}'

    def delete(self, using=None, keep_parents=False):
        self.est_active = False
        self.save(update_fields=['est_active', 'updated_at'])


# Une CommandeLigne représente UN plat spécifique dans une commande
# Exemple : "2 Pizzas Margherita" est UNE ligne de la commande #123
class CommandeLigne(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        EN_PREPARATION = 'EN_PREPARATION', 'En préparation'
        PRET = 'PRET', 'Prêt'
        SERVI = 'SERVI', 'Servi'
        ANNULE = 'ANNULE', 'Annulé'

    # Liaison forte : si on supprime la commande, on supprime ses lignes
    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name='lignes',
    )
    plat = models.ForeignKey(
        'menu.Plat',
        on_delete=models.PROTECT,
        related_name='lignes_commande',
    )
    quantite = models.PositiveIntegerField(default=1)
    # On stocke le prix au moment de la commande (si le prix du menu change plus tard, le ticket reste correct)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, blank=True)
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
    )
    notes = models.TextField(blank=True)
    heure_lancement = models.DateTimeField(null=True, blank=True)
    heure_fin_estimee = models.DateTimeField(null=True, blank=True)
    temps_preparation_snapshot = models.PositiveIntegerField(null=True, blank=True)
    celery_task_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ligne de commande'
        verbose_name_plural = 'Lignes de commande'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['commande', 'statut']),
        ]

    def __str__(self):
        return f'{self.plat.nom} x{self.quantite}'

    def save(self, *args, **kwargs):
        if self.prix_unitaire in (None, ''):
            self.prix_unitaire = self.plat.prix
        super().save(*args, **kwargs)
