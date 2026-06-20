from django.contrib.auth import get_user_model
from django.db import models
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import IsGerant, IsCuisinierOrGerant
from core.pagination import OptInPageNumberPagination
from .models import Ingredient, PlatIngredient, MouvementStock
from .serializers import IngredientSerializer, PlatIngredientSerializer, MouvementStockSerializer

from rest_framework.decorators import action
from .services.procurement import ProcurementService

User = get_user_model()


class IngredientViewSet(viewsets.ModelViewSet):
    serializer_class = IngredientSerializer
    pagination_class = OptInPageNumberPagination

    def get_permissions(self):
        """GERANT: full CRUD. All authenticated users: read-only."""
        if self.action in ('list', 'retrieve', 'forecasting'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        """GERANT sees all including inactive; others only see active ingredients."""
        user = self.request.user
        if user.is_authenticated and user.role == User.Role.GERANT:
            queryset = Ingredient.objects.all()
        else:
            queryset = Ingredient.objects.filter(est_active=True)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(nom__icontains=search)
                | models.Q(unite_mesure__icontains=search)
            )

        est_active = self.request.query_params.get('est_active')
        if est_active in ('true', '1'):
            queryset = queryset.filter(est_active=True)
        elif est_active in ('false', '0'):
            queryset = queryset.filter(est_active=False)

        return queryset.order_by('nom', 'id')

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

    def get_queryset(self):
        queryset = self.queryset
        plat = self.request.query_params.get('plat')
        if plat:
            queryset = queryset.filter(plat_id=plat)
        return queryset


class MouvementStockViewSet(viewsets.ModelViewSet):
    serializer_class = MouvementStockSerializer
    queryset = MouvementStock.objects.select_related('ingredient').all()

    def get_permissions(self):
        """GERANT: full CRUD. All authenticated users: read-only."""
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGerant()]
