from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import IsGerant
from .models import Categorie, Plat
from .serializers import CategorieSerializer, PlatSerializer


class CategorieViewSet(viewsets.ModelViewSet):
    serializer_class = CategorieSerializer

    def get_permissions(self):
        """GERANT: full CRUD. All authenticated users: read-only (per D-05)."""
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
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
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'GERANT':
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
