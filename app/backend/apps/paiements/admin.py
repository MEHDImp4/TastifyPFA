from django.contrib import admin
from .models import Paiement, PaiementItem


class PaiementItemInline(admin.TabularInline):
    model = PaiementItem
    extra = 0


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ('id', 'commande', 'montant', 'methode', 'statut', 'created_at')
    list_filter = ('methode', 'statut', 'created_at')
    search_fields = ('commande__id', 'reference_transaction')
    inlines = [PaiementItemInline]


@admin.register(PaiementItem)
class PaiementItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'paiement', 'commande_ligne', 'montant_contribue')
    list_filter = ('paiement__statut',)
    search_fields = ('paiement__id', 'commande_ligne__id')
