from django.db import models
from django.db.models import Avg, Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import IsCuisinierOrGerant, IsGerant
from core.pagination import OptInPageNumberPagination
from .models import Categorie, Plat
from .serializers import CategorieSerializer, PlatSerializer


class CategorieViewSet(viewsets.ModelViewSet):
    serializer_class = CategorieSerializer

    def get_permissions(self):
        # Tout le monde peut lire le menu, mais seul le gérant peut le modifier.
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'GERANT':
            return Categorie.objects.all().order_by('ordre_affichage', 'nom')
        return Categorie.objects.active().order_by('ordre_affichage', 'nom')

    def destroy(self, request, *args, **kwargs):
        categorie = self.get_object()
        categorie.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlatViewSet(viewsets.ModelViewSet):
    serializer_class = PlatSerializer
    pagination_class = OptInPageNumberPagination

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'recommendations', 'top_recommendations'):
            return [AllowAny()]
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsCuisinierOrGerant()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        user = self.request.user
        plats = Plat.objects.select_related('categorie').order_by(
            'categorie__ordre_affichage',
            'categorie__nom',
            'nom',
            'id',
        )

        if user.is_authenticated and user.role in ['GERANT', 'CUISINIER']:
            queryset = plats.filter(est_active=True) if self.action == 'list' else plats
        else:
            queryset = plats.filter(est_active=True, est_disponible=True)

        if self.action == 'list':
            categorie_id = self.request.query_params.get('categorie')
            if categorie_id:
                if not categorie_id.isdecimal():
                    return queryset.none()
                queryset = queryset.filter(categorie_id=int(categorie_id))

            search = self.request.query_params.get('search')
            if search:
                queryset = queryset.filter(
                    models.Q(nom__icontains=search)
                    | models.Q(description__icontains=search)
                    | models.Q(categorie__nom__icontains=search)
                )

        return queryset

    def destroy(self, request, *args, **kwargs):
        plat = self.get_object()
        plat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def recommendations(self, request, pk=None):
        plat = self.get_object()

        # Règle simple: recommander d'abord des plats de la même catégorie.
        recommandations = list(
            Plat.objects.filter(
                categorie=plat.categorie,
                est_active=True,
                est_disponible=True,
            )
            .exclude(id=plat.id)
            .order_by('nom')[:5]
        )

        if len(recommandations) < 5:
            autres_plats = (
                Plat.objects.filter(est_active=True, est_disponible=True)
                .exclude(id=plat.id)
                .exclude(id__in=[item.id for item in recommandations])
                .order_by('nom')
            )

            for autre_plat in autres_plats:
                recommandations.append(autre_plat)
                if len(recommandations) == 5:
                    break

        serializer = self.get_serializer(recommandations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='top-recommendations')
    def top_recommendations(self, request):
        # Démo PFA: les plats appréciés sont classés par analyse de sentiment.
        plats = (
            Plat.objects.filter(est_active=True, est_disponible=True)
            .annotate(
                avg_sentiment=Avg('avis__sentiment_score'),
                avis_count=Count('avis', filter=models.Q(avis__sentiment_score__isnull=False)),
            )
            .order_by(
                models.F('avg_sentiment').desc(nulls_last=True),
                '-avis_count',
                'nom',
            )[:4]
        )
        serializer = self.get_serializer(plats, many=True)
        return Response(serializer.data)
