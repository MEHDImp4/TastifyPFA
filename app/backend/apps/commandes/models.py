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


class Commande(models.Model):
    class Statut(models.TextChoices):
        EN_COURS = 'EN_COURS', 'En cours'
        EN_CUISINE = 'EN_CUISINE', 'En cuisine'
        PRETE = 'PRETE', 'Prete'
        PAYEE = 'PAYEE', 'Payee'
        ANNULEE = 'ANNULEE', 'Annulee'

    class Type(models.TextChoices):
        SUR_PLACE = 'SUR_PLACE', 'Sur place'
        EMPORTER = 'EMPORTER', 'A emporter'

    table = models.ForeignKey(
        'tables.Table',
        on_delete=models.PROTECT,
        related_name='commandes',
        null=True,
        blank=True,
    )
    serveur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='commandes',
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
    montant_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    est_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CommandeManager()

    class Meta:
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['statut', 'created_at']),
            models.Index(fields=['table']),
        ]

    def __str__(self):
        type_label = "Emporter" if self.type == self.Type.EMPORTER else "Table"
        target = self.client_nom if self.type == self.Type.EMPORTER else self.table_id
        return f'Commande #{self.pk} - {type_label} {target}'

    def delete(self, using=None, keep_parents=False):
        self.est_active = False
        self.save(update_fields=['est_active', 'updated_at'])


class CommandeLigne(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        EN_PREPARATION = 'EN_PREPARATION', 'En preparation'
        PRET = 'PRET', 'Pret'
        SERVI = 'SERVI', 'Servi'
        ANNULE = 'ANNULE', 'Annule'

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
