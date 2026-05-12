from django.contrib.auth import get_user_model
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import IsGerant, IsCuisinierOrGerant
from .models import Ingredient, PlatIngredient
from .serializers import IngredientSerializer, PlatIngredientSerializer

from rest_framework.decorators import action
from .services.procurement import ProcurementService

User = get_user_model()


class IngredientViewSet(viewsets.ModelViewSet):
    serializer_class = IngredientSerializer

    def get_permissions(self):
        """GERANT: full CRUD. All authenticated users: read-only."""
        if self.action in ('list', 'retrieve', 'forecasting'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        """GERANT sees all including inactive; others only see active ingredients."""
        user = self.request.user
        if user.is_authenticated and user.role == User.Role.GERANT:
            return Ingredient.objects.all().order_by('nom')
        return Ingredient.objects.filter(est_active=True).order_by('nom')

    @action(detail=False, methods=['get'])
    def forecasting(self, request):
        """
        Returns AI-powered stock forecasts based on weather and historical sales.
        """
        data = ProcurementService.get_forecasted_needs()
        return Response(data)

    def destroy(self, request, *args, **kwargs):
        """Soft delete — sets est_active=False instead of hard-deleting."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlatIngredientViewSet(viewsets.ModelViewSet):
    serializer_class = PlatIngredientSerializer
    queryset = PlatIngredient.objects.select_related('plat', 'ingredient').all()

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsCuisinierOrGerant()]
