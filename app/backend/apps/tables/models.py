from django.db import models


class TableQuerySet(models.QuerySet):
    def active(self):
        return self.filter(est_active=True)


class TableManager(models.Manager):
    def get_queryset(self):
        return TableQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()


class Table(models.Model):

    class Statut(models.TextChoices):
        LIBRE        = 'LIBRE',        'Libre'
        OCCUPEE      = 'OCCUPEE',      'Occupée'
        RESERVEE     = 'RESERVEE',     'Réservée'
        ENCAISSEMENT = 'ENCAISSEMENT', 'Encaissement'

    numero    = models.PositiveIntegerField(unique=True)
    capacite  = models.PositiveIntegerField()
    statut    = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.LIBRE,
    )
    pos_x     = models.FloatField(default=0.0)
    pos_y     = models.FloatField(default=0.0)
    est_active = models.BooleanField(default=True)
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

