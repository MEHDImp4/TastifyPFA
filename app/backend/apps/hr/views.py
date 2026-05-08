from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import IsGerant
from .models import Employe
from .serializers import EmployeSerializer

class EmployeViewSet(viewsets.ModelViewSet):
    queryset = Employe.objects.select_related('user').all()
    serializer_class = EmployeSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        if self.request.user.role == 'GERANT':
            return self.queryset
        return self.queryset.filter(user__is_active=True)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = instance.user
        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
