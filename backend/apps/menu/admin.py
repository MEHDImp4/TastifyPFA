from django.contrib import admin
from .models import Categorie, Plat


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ['nom', 'ordre_affichage', 'est_active', 'created_at']
    list_filter = ['est_active']
    search_fields = ['nom']


@admin.register(Plat)
class PlatAdmin(admin.ModelAdmin):
    list_display = ['nom', 'categorie', 'prix', 'temps_preparation', 'est_disponible', 'est_active', 'created_at']
    list_filter = ['categorie', 'est_disponible', 'est_active']
    search_fields = ['nom', 'description']
