from django.db import models


class TableQuerySet(models.QuerySet):
    def active(self):
        return self.filter(est_active=True)


class TableManager(models.Manager):
    def get_queryset(self):
        return TableQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()


# Gestion du Plan de Salle et des Tables
# Ce module permet de positionner graphiquement les tables dans le restaurant.

class Table(models.Model):
    # Les différents états d'une table pendant le service
    class Statut(models.TextChoices):
        LIBRE        = 'LIBRE',        'Libre'        # Prête pour de nouveaux clients
        OCCUPEE      = 'OCCUPEE',      'Occupée'      # Des clients sont en train de manger
        RESERVEE     = 'RESERVEE',     'Réservée'     # Bloquée pour une réservation future
        ENCAISSEMENT = 'ENCAISSEMENT', 'Encaissement' # En attente du paiement final

    numero    = models.PositiveIntegerField(unique=True) # Numéro unique (ex: Table 12)
    capacite  = models.PositiveIntegerField() # Nombre de places (ex: Table de 4 personnes)
    statut    = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.LIBRE,
    )
    
    # Coordonnées (x, y) pour l'affichage visuel sur le plan de salle interactif
    pos_x     = models.FloatField(default=0.0)
    pos_y     = models.FloatField(default=0.0)
    
    est_active = models.BooleanField(default=True) # Soft delete
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TableManager()

    class Meta:
        verbose_name = 'Table'
        verbose_name_plural = 'Tables'
        ordering = ['numero']

    def __str__(self):
        return f'Table {self.numero}'

    def delete(self, using=None, keep_parents=False):
        self.est_active = False
        self.save(update_fields=['est_active', 'updated_at'])


class PlanText(models.Model):
    texte = models.CharField(max_length=255)
    pos_x = models.FloatField(default=0.0)
    pos_y = models.FloatField(default=0.0)
    est_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TableManager()

    class Meta:
        verbose_name = 'Texte du Plan'
        verbose_name_plural = 'Textes du Plan'
        ordering = ['created_at']

    def delete(self, using=None, keep_parents=False):
        self.est_active = False
        self.save(update_fields=['est_active', 'updated_at'])

