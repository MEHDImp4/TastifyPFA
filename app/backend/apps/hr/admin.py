from django.contrib import admin
from .models import Employe, Shift, OffreEmploi, Candidature

@admin.register(Employe)
class EmployeAdmin(admin.ModelAdmin):
    list_display = ('get_name', 'poste', 'salaire', 'date_embauche', 'cin')
    list_filter = ('poste', 'date_embauche')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'cin', 'poste')
    raw_id_fields = ('user',)

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_name.short_description = 'Employé'

@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('employe', 'jour', 'heure_debut', 'heure_fin')
    list_filter = ('jour',)
    search_fields = ('employe__user__username', 'employe__user__first_name', 'employe__user__last_name')
    raw_id_fields = ('employe',)

@admin.register(OffreEmploi)
class OffreEmploiAdmin(admin.ModelAdmin):
    list_display = ('titre', 'type_contrat', 'est_publiee', 'created_at')
    list_filter = ('type_contrat', 'est_publiee')
    search_fields = ('titre',)

@admin.register(Candidature)
class CandidatureAdmin(admin.ModelAdmin):
    list_display = ('nom_complet', 'offre', 'statut', 'created_at')
    list_filter = ('statut',)
    search_fields = ('nom_complet', 'email')
    raw_id_fields = ('offre',)
