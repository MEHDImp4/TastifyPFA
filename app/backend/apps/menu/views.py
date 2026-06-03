from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.core.cache import cache
from django.db.models import Count, Avg, Prefetch

from apps.users.permissions import IsGerant, IsCuisinierOrGerant
from apps.avis.models import Avis
from .models import Categorie, Plat
from .serializers import CategorieSerializer, PlatSerializer


# Ce fichier contient les Vues (Views) pour le Menu
# On utilise ModelViewSet, qui crée automatiquement les routes GET, POST, PUT, DELETE.

class CategorieViewSet(viewsets.ModelViewSet):
    serializer_class = CategorieSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'GERANT':
            return Categorie.objects.all().order_by('ordre_affichage', 'nom')
        return Categorie.objects.active().order_by('ordre_affichage', 'nom')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlatViewSet(viewsets.ModelViewSet):
    serializer_class = PlatSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'recommendations', 'top_recommendations'):
            return [AllowAny()]
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsCuisinierOrGerant()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        user = self.request.user
        
        # Base Queryset with sentiment calculation
        queryset = Plat.objects.annotate(
            sentiment_score=Avg('avis__sentiment_score')
        ).prefetch_related(
            Prefetch('avis', queryset=Avis.objects.order_by('-created_at')[:3], to_attr='top_avis')
        )
        
        if user.is_authenticated and user.role in ['GERANT', 'CUISINIER']:
            if self.action == 'list':
                return queryset.filter(est_active=True).order_by('categorie', 'nom')
            return queryset.order_by('categorie', 'nom')

        return queryset.filter(est_active=True, est_disponible=True).order_by('categorie', 'nom')

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
            plats = Plat.objects.filter(id__in=recommended_ids, est_active=True, est_disponible=True).annotate(
                sentiment_score=Avg('avis__sentiment_score')
            ).prefetch_related(
                Prefetch('avis', queryset=Avis.objects.order_by('-created_at')[:3], to_attr='top_avis')
            )
            plats_dict = {p.id: p for p in plats}
            ordered_plats = [plats_dict[rid] for rid in recommended_ids if rid in plats_dict]
            
            if ordered_plats:
                serializer = self.get_serializer(ordered_plats, many=True)
                return Response(serializer.data)

        # Fallback to popular plats
        popular_plats = Plat.objects.filter(
            est_active=True, est_disponible=True
        ).exclude(
            id=plat.id
        ).annotate(
            lignes_count=Count('lignes_commande'),
            sentiment_score=Avg('avis__sentiment_score')
        ).prefetch_related(
            Prefetch('avis', queryset=Avis.objects.order_by('-created_at')[:3], to_attr='top_avis')
        ).order_by('-lignes_count', 'nom')[:5]

        serializer = self.get_serializer(popular_plats, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='top-recommendations')
    def top_recommendations(self, request):
        # Rank by sentiment score first, then by order count
        # This allows cross-category trending items to surface
        top_plats = Plat.objects.filter(
            est_active=True, est_disponible=True
        ).annotate(
            sentiment_score=Avg('avis__sentiment_score'),
            lignes_count=Count('lignes_commande')
        ).prefetch_related(
            Prefetch('avis', queryset=Avis.objects.order_by('-created_at')[:3], to_attr='top_avis')
        ).order_by('-sentiment_score', '-lignes_count', 'nom')[:4]
        
        serializer = self.get_serializer(top_plats, many=True)
        return Response(serializer.data)
