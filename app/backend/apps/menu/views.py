from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.core.cache import cache
from django.db.models import Count

from apps.users.permissions import IsGerant, IsCuisinierOrGerant
from .models import Categorie, Plat
from .serializers import CategorieSerializer, PlatSerializer


class CategorieViewSet(viewsets.ModelViewSet):
    serializer_class = CategorieSerializer

    def get_permissions(self):
        """GERANT: full CRUD. All authenticated users: read-only (per D-05)."""
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        """D-06: Non-GERANT users only see active categories."""
        user = self.request.user
        if user.is_authenticated and user.role == 'GERANT':
            return Categorie.objects.all().order_by('ordre_affichage', 'nom')
        return Categorie.objects.active().order_by('ordre_affichage', 'nom')

    def destroy(self, request, *args, **kwargs):
        """D-07: Soft delete — sets est_active=False instead of hard-deleting."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlatViewSet(viewsets.ModelViewSet):
    serializer_class = PlatSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'recommendations'):
            return [AllowAny()]
        if self.action == 'partial_update':
            return [IsAuthenticated(), IsCuisinierOrGerant()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role in ['GERANT', 'CUISINIER']:
            qs = Plat.objects.all()
        else:
            qs = Plat.objects.active().filter(est_disponible=True)
        categorie_id = self.request.query_params.get('categorie')
        if categorie_id:
            qs = qs.filter(categorie_id=categorie_id)
        return qs.order_by('categorie', 'nom')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def recommendations(self, request, pk=None):
        plat = self.get_object()
        similarities = cache.get('plat_similarities') or {}
        recommended_ids = similarities.get(plat.id, [])

        if recommended_ids:
            # Preserve order from cache if possible, but we just filter for now
            # Note: We only return active and available plats per threat model
            plats = Plat.objects.active().filter(id__in=recommended_ids, est_disponible=True)
            
            # Sort manually to preserve order of recommendation if needed, or just let DB order
            plats_dict = {p.id: p for p in plats}
            ordered_plats = [plats_dict[rid] for rid in recommended_ids if rid in plats_dict]
            
            if ordered_plats:
                serializer = self.get_serializer(ordered_plats, many=True)
                return Response(serializer.data)

        # Fallback: top 5 most popular active plats
        popular_plats = Plat.objects.active().filter(
            est_disponible=True
        ).exclude(
            id=plat.id
        ).annotate(
            lignes_count=Count('lignes_commande')
        ).order_by('-lignes_count', 'nom')[:5]

        serializer = self.get_serializer(popular_plats, many=True)
        return Response(serializer.data)
