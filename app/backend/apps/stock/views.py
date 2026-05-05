from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import IsGerant
from .models import Ingredient
from .serializers import IngredientSerializer


class IngredientViewSet(viewsets.ModelViewSet):
    serializer_class = IngredientSerializer

    def get_permissions(self):
        """GERANT: full CRUD. All authenticated users: read-only."""
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        """GERANT sees all including inactive; others only see active ingredients."""
        user = self.request.user
        if user.is_authenticated and user.role == 'GERANT':
            return Ingredient.objects.all().order_by('nom')
        return Ingredient.objects.filter(est_active=True).order_by('nom')

    def destroy(self, request, *args, **kwargs):
        """Soft delete — sets est_active=False instead of hard-deleting."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
