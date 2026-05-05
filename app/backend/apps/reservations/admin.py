from django.contrib import admin

from apps.reservations.models import Reservation


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'client',
        'table',
        'date_reservation',
        'heure_debut',
        'heure_fin',
        'nombre_personnes',
        'statut',
    )
    list_filter = ('statut', 'date_reservation', 'table')
    search_fields = ('client__username', 'table__numero')

