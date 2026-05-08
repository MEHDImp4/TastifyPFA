from django.contrib import admin
from .models import Avis

@admin.register(Avis)
class AvisAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'plat', 'note', 'sentiment_score', 'created_at')
    list_filter = ('note', 'sentiment_score', 'created_at')
    search_fields = ('user__username', 'commentaire', 'plat__nom')
    readonly_fields = ('sentiment_score', 'created_at', 'updated_at')
