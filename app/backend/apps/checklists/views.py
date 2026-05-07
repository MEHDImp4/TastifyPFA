from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.checklists.models import Checklist, ChecklistExecution, ChecklistItemResponse
from apps.checklists.permissions import (
    IsChecklistStaff,
    IsGerantOrReadOnlyForChecklistStaff,
)
from apps.checklists.serializers import (
    ChecklistExecutionSerializer,
    ChecklistItemResponseSerializer,
    ChecklistSerializer,
)


class ChecklistViewSet(viewsets.ModelViewSet):
    queryset = Checklist.objects.prefetch_related('tasks').all()
    serializer_class = ChecklistSerializer
    permission_classes = [IsAuthenticated, IsGerantOrReadOnlyForChecklistStaff]


class ChecklistExecutionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ChecklistExecutionSerializer
    permission_classes = [IsAuthenticated, IsChecklistStaff]

    def get_queryset(self):
        queryset = (
            ChecklistExecution.objects.select_related('checklist', 'execute_par')
            .prefetch_related('checklist__tasks', 'responses__task', 'responses__completed_by')
            .order_by('-date', 'checklist__type', 'checklist__titre', 'id')
        )
        date_value = self.request.query_params.get('date')
        if date_value:
            return queryset.filter(date=date_value)
        return queryset.filter(date=timezone.localdate())


class ChecklistItemResponseViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = ChecklistItemResponse.objects.select_related(
        'execution',
        'task',
        'completed_by',
    )
    serializer_class = ChecklistItemResponseSerializer
    permission_classes = [IsAuthenticated, IsChecklistStaff]
    http_method_names = ['get', 'patch', 'head', 'options']

