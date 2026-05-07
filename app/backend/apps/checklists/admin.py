from django.contrib import admin

from apps.checklists.models import (
    Checklist,
    ChecklistExecution,
    ChecklistItemResponse,
    TaskChecklist,
)


class TaskChecklistInline(admin.TabularInline):
    model = TaskChecklist
    extra = 0


class ChecklistItemResponseInline(admin.TabularInline):
    model = ChecklistItemResponse
    extra = 0
    readonly_fields = ('completed_at',)


@admin.register(Checklist)
class ChecklistAdmin(admin.ModelAdmin):
    list_display = ('titre', 'type', 'active', 'created_at')
    list_filter = ('type', 'active')
    search_fields = ('titre',)
    inlines = [TaskChecklistInline]


@admin.register(ChecklistExecution)
class ChecklistExecutionAdmin(admin.ModelAdmin):
    list_display = ('checklist', 'date', 'statut', 'execute_par')
    list_filter = ('statut', 'date', 'checklist__type')
    search_fields = ('checklist__titre', 'execute_par__username')
    inlines = [ChecklistItemResponseInline]

