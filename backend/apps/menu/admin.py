from django.contrib import admin
from .models import Categorie


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ['nom', 'ordre_affichage', 'est_active', 'created_at']
    list_filter = ['est_active']
    search_fields = ['nom']
