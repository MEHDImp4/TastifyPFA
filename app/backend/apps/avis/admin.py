from django.contrib import admin
from .models import Avis, AnalyseSentiment


@admin.register(Avis)
class AvisAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'plat', 'note', 'sentiment_score', 'lang_code', 'created_at')
    list_filter = ('note', 'lang_code')
    search_fields = ('commentaire', 'user__username')
    readonly_fields = ('sentiment_score', 'lang_code', 'created_at', 'updated_at')
    ordering = ('-created_at',)


@admin.register(AnalyseSentiment)
class AnalyseSentimentAdmin(admin.ModelAdmin):
    list_display = ('id', 'avis', 'label', 'score_brut', 'modele_utilise', 'date_analyse')
    list_filter = ('label', 'modele_utilise')
    search_fields = ('avis__commentaire',)
    readonly_fields = ('date_analyse',)
    ordering = ('-date_analyse',)
