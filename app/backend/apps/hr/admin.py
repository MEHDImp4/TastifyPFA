from django.contrib import admin
from .models import Employe

@admin.register(Employe)
class EmployeAdmin(admin.ModelAdmin):
    list_display = ('get_name', 'poste', 'salaire', 'date_embauche', 'cin')
    list_filter = ('poste', 'date_embauche')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'cin', 'poste')
    raw_id_fields = ('user',)

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_name.short_description = 'Employé'
