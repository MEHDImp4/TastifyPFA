from django.contrib import admin
from .models import Ingredient, PlatIngredient


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ['nom', 'unite_mesure', 'stock_actuel', 'seuil_alerte', 'est_active', 'created_at']
    list_filter = ['unite_mesure', 'est_active']
    search_fields = ['nom']


@admin.register(PlatIngredient)
class PlatIngredientAdmin(admin.ModelAdmin):
    list_display = ['plat', 'ingredient', 'quantite_requise']
    list_filter = ['ingredient__unite_mesure']
    search_fields = ['plat__nom', 'ingredient__nom']
