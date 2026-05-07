from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.checklists.models import (
    Checklist,
    ChecklistExecution,
    ChecklistItemResponse,
    TaskChecklist,
)


class TaskChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskChecklist
        fields = [
            'id',
            'description',
            'ordre',
            'est_obligatoire',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChecklistSerializer(serializers.ModelSerializer):
    tasks = TaskChecklistSerializer(many=True)

    class Meta:
        model = Checklist
        fields = [
            'id',
            'titre',
            'type',
            'active',
            'tasks',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_tasks(self, value):
        if not value:
            raise serializers.ValidationError(
                'Une checklist doit contenir au moins une tache.'
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        tasks_data = validated_data.pop('tasks')
        checklist = Checklist.objects.create(**validated_data)
        TaskChecklist.objects.bulk_create(
            [
                TaskChecklist(checklist=checklist, **task_data)
                for task_data in tasks_data
            ]
        )
        return Checklist.objects.prefetch_related('tasks').get(pk=checklist.pk)

    @transaction.atomic
    def update(self, instance, validated_data):
        tasks_data = validated_data.pop('tasks', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tasks_data is not None:
            instance.tasks.all().delete()
            TaskChecklist.objects.bulk_create(
                [
                    TaskChecklist(checklist=instance, **task_data)
                    for task_data in tasks_data
                ]
            )

        return Checklist.objects.prefetch_related('tasks').get(pk=instance.pk)


class ChecklistItemResponseSerializer(serializers.ModelSerializer):
    task = TaskChecklistSerializer(read_only=True)

    class Meta:
        model = ChecklistItemResponse
        fields = [
            'id',
            'task',
            'est_complete',
            'completed_at',
            'completed_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'task',
            'completed_at',
            'completed_by',
            'created_at',
            'updated_at',
        ]

    def update(self, instance, validated_data):
        request = self.context['request']
        est_complete = validated_data.get('est_complete', instance.est_complete)

        instance.est_complete = est_complete
        if est_complete:
            instance.completed_at = timezone.now()
            instance.completed_by = request.user
        else:
            instance.completed_at = None
            instance.completed_by = None
        instance.save()
        instance.execution.refresh_status()
        return instance


class ChecklistExecutionSerializer(serializers.ModelSerializer):
    checklist_details = ChecklistSerializer(source='checklist', read_only=True)
    responses = ChecklistItemResponseSerializer(many=True, read_only=True)

    class Meta:
        model = ChecklistExecution
        fields = [
            'id',
            'checklist',
            'checklist_details',
            'date',
            'execute_par',
            'statut',
            'responses',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'execute_par',
            'statut',
            'responses',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        checklist = attrs.get('checklist') or getattr(self.instance, 'checklist', None)
        if checklist and not checklist.active:
            raise serializers.ValidationError(
                {'checklist': 'Impossible de lancer une checklist inactive.'}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context['request']
        execution = ChecklistExecution.objects.create(
            execute_par=request.user,
            **validated_data,
        )
        tasks = list(execution.checklist.tasks.all())
        ChecklistItemResponse.objects.bulk_create(
            [
                ChecklistItemResponse(execution=execution, task=task)
                for task in tasks
            ]
        )
        execution.refresh_status(save=True)
        return (
            ChecklistExecution.objects.select_related('checklist', 'execute_par')
            .prefetch_related('checklist__tasks', 'responses__task', 'responses__completed_by')
            .get(pk=execution.pk)
        )

