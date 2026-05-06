import datetime

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.reservations.constants import RESERVATION_CLEANUP_BUFFER


class ReservationQuerySet(models.QuerySet):
    def active(self):
        return self.exclude(
            statut__in=[
                Reservation.Statut.ANNULEE,
                Reservation.Statut.ABSENTE,
            ]
        )

    def for_table_day(self, *, table_id, date_reservation):
        return self.filter(table_id=table_id, date_reservation=date_reservation)


class ReservationManager(models.Manager):
    def get_queryset(self):
        return ReservationQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()

    def for_table_day(self, *, table_id, date_reservation):
        return self.get_queryset().for_table_day(
            table_id=table_id,
            date_reservation=date_reservation,
        )


class Reservation(models.Model):
    class Statut(models.TextChoices):
        CONFIRMEE = 'CONFIRMEE', 'Confirmee'
        ANNULEE = 'ANNULEE', 'Annulee'
        PRESENTE = 'PRESENTE', 'Presente'
        ABSENTE = 'ABSENTE', 'Absente'

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='reservations',
    )
    table = models.ForeignKey(
        'tables.Table',
        on_delete=models.PROTECT,
        related_name='reservations',
    )
    date_reservation = models.DateField()
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    nombre_personnes = models.PositiveIntegerField()
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.CONFIRMEE,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ReservationManager()

    class Meta:
        verbose_name = 'Reservation'
        verbose_name_plural = 'Reservations'
        ordering = ['date_reservation', 'heure_debut', 'id']
        indexes = [
            models.Index(
                fields=['table', 'date_reservation', 'heure_debut'],
                name='reserv_table_date_start_idx',
            ),
            models.Index(
                fields=['table', 'date_reservation', 'statut'],
                name='reserv_table_date_status_idx',
            ),
            models.Index(
                fields=['client', 'date_reservation'],
                name='reserv_client_date_idx',
            ),
        ]

    def __str__(self):
        return (
            f'Reservation #{self.pk or "new"} '
            f'- Table {self.table_id} on {self.date_reservation}'
        )

    @property
    def buffered_end(self):
        return (
            datetime.datetime.combine(self.date_reservation, self.heure_fin)
            + RESERVATION_CLEANUP_BUFFER
        ).time()

    def clean(self):
        errors = {}

        if self.heure_fin <= self.heure_debut:
            errors['heure_fin'] = 'L heure de fin doit etre apres l heure de debut.'

        if self.table_id and self.nombre_personnes and self.table.capacite < self.nombre_personnes:
            errors['nombre_personnes'] = (
                'Le nombre de personnes depasse la capacite de la table.'
            )

        if (
            self.table_id
            and self.date_reservation
            and self.heure_debut
            and self.heure_fin
            and not errors
            and self.has_active_conflict()
        ):
            errors['__all__'] = (
                'Cette table est deja reservee sur ce creneau, buffer inclus.'
            )

        if errors:
            raise ValidationError(errors)

    def has_active_conflict(self):
        candidate_reservations = (
            Reservation.objects.active()
            .filter(
                table_id=self.table_id,
                date_reservation__in=[
                    self.date_reservation - datetime.timedelta(days=1),
                    self.date_reservation,
                    self.date_reservation + datetime.timedelta(days=1),
                ],
            )
            .exclude(pk=self.pk)
        )
        requested_start = datetime.datetime.combine(
            self.date_reservation,
            self.heure_debut,
        )
        requested_end = datetime.datetime.combine(
            self.date_reservation,
            self.heure_fin,
        ) + RESERVATION_CLEANUP_BUFFER

        for reservation in candidate_reservations:
            existing_start = datetime.datetime.combine(
                reservation.date_reservation,
                reservation.heure_debut,
            )
            existing_end = datetime.datetime.combine(
                reservation.date_reservation,
                reservation.heure_fin,
            ) + RESERVATION_CLEANUP_BUFFER
            if existing_start < requested_end and existing_end > requested_start:
                return True
        return False

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

