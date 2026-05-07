from django.conf import settings
from django.db import models


class Checklist(models.Model):
    class Type(models.TextChoices):
        OUVERTURE = 'OUVERTURE', 'Ouverture'
        FERMETURE = 'FERMETURE', 'Fermeture'
        HEBDOMADAIRE = 'HEBDOMADAIRE', 'Hebdomadaire'

    titre = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=Type.choices)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['type', 'titre', 'id']
        verbose_name = 'Checklist'
        verbose_name_plural = 'Checklists'

    def __str__(self):
        return self.titre


class TaskChecklist(models.Model):
    checklist = models.ForeignKey(
        Checklist,
        on_delete=models.CASCADE,
        related_name='tasks',
    )
    description = models.TextField()
    ordre = models.PositiveIntegerField(default=1)
    est_obligatoire = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ordre', 'id']
        verbose_name = 'Checklist task'
        verbose_name_plural = 'Checklist tasks'

    def __str__(self):
        return f'{self.checklist.titre} #{self.ordre}'


class ChecklistExecution(models.Model):
    class Statut(models.TextChoices):
        EN_COURS = 'EN_COURS', 'En cours'
        TERMINE = 'TERMINE', 'Termine'

    checklist = models.ForeignKey(
        Checklist,
        on_delete=models.CASCADE,
        related_name='executions',
    )
    date = models.DateField()
    execute_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='checklist_executions',
    )
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_COURS,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'checklist__type', 'checklist__titre', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['checklist', 'date'],
                name='checklist_execution_unique_day',
            ),
        ]
        verbose_name = 'Checklist execution'
        verbose_name_plural = 'Checklist executions'

    def __str__(self):
        return f'{self.checklist.titre} - {self.date}'

    def refresh_status(self, *, save=True):
        has_incomplete_required_items = self.responses.filter(
            task__est_obligatoire=True,
            est_complete=False,
        ).exists()
        self.statut = (
            self.Statut.EN_COURS
            if has_incomplete_required_items
            else self.Statut.TERMINE
        )
        if save:
            self.save(update_fields=['statut', 'updated_at'])
        return self.statut


class ChecklistItemResponse(models.Model):
    execution = models.ForeignKey(
        ChecklistExecution,
        on_delete=models.CASCADE,
        related_name='responses',
    )
    task = models.ForeignKey(
        TaskChecklist,
        on_delete=models.CASCADE,
        related_name='responses',
    )
    est_complete = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checklist_item_responses',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['task__ordre', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['execution', 'task'],
                name='checklist_response_unique_task',
            ),
        ]
        verbose_name = 'Checklist item response'
        verbose_name_plural = 'Checklist item responses'

    def __str__(self):
        return f'{self.execution} - {self.task.ordre}'

