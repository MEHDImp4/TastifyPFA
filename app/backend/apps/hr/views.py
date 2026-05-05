from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import IsGerant
from .models import Employe
from .serializers import EmployeSerializer

class EmployeViewSet(viewsets.ModelViewSet):
    queryset = Employe.objects.select_related('user').all()
    serializer_class = EmployeSerializer
    permission_classes = [IsAuthenticated, IsGerant]

    def get_queryset(self):
        # Only active users should be considered active employees by default
        return self.queryset.filter(user__is_active=True)

    def destroy(self, request, *args, **kwargs):
        """Soft delete: deactivates the linked User account instead of deleting from DB."""
        instance = self.get_object()
        user = instance.user
        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
