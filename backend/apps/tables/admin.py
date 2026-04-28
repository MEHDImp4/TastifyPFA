from django.contrib import admin
from .models import Table


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ['numero', 'capacite', 'statut', 'pos_x', 'pos_y', 'est_active', 'created_at']
    list_filter = ['statut', 'capacite', 'est_active']
    search_fields = ['numero']
