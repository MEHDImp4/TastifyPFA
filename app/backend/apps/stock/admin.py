from django.contrib import admin
from .models import Ingredient, PlatIngredient, MouvementStock


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    actions = None
    list_display = ['nom', 'unite_mesure', 'stock_actuel', 'seuil_alerte', 'est_active', 'created_at']
    list_filter = ['unite_mesure', 'est_active']
    search_fields = ['nom']


@admin.register(PlatIngredient)
class PlatIngredientAdmin(admin.ModelAdmin):
    list_display = ['plat', 'ingredient', 'quantite_requise']
    list_filter = ['ingredient__unite_mesure']
    search_fields = ['plat__nom', 'ingredient__nom']


@admin.register(MouvementStock)
class MouvementStockAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'ingredient', 'quantite', 'type_mouvement', 'source']
    list_filter = ['type_mouvement', 'source', 'created_at']
    search_fields = ['ingredient__nom', 'commentaire']
    readonly_fields = ['created_at']
