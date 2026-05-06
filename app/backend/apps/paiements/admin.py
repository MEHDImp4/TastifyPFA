from django.contrib import admin

from apps.paiements.models import Paiement, PaiementItem


class PaiementItemInline(admin.TabularInline):
    model = PaiementItem
    extra = 0


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ('id', 'commande', 'montant', 'methode', 'statut', 'reference_transaction')
    list_filter = ('statut', 'methode')
    search_fields = ('reference_transaction', 'commande__id')
    inlines = [PaiementItemInline]


@admin.register(PaiementItem)
class PaiementItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'paiement', 'commande_ligne', 'montant_contribue')
    search_fields = ('paiement__id', 'commande_ligne__id')

