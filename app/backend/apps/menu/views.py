from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.core.cache import cache
from django.db.models import Count

from apps.users.permissions import IsGerant, IsCuisinierOrGerant
from .models import Categorie, Plat
from .serializers import CategorieSerializer, PlatSerializer


# Ce fichier contient les Vues (Views) pour le Menu
# On utilise ModelViewSet, qui crée automatiquement les routes GET, POST, PUT, DELETE.

class CategorieViewSet(viewsets.ModelViewSet):
    serializer_class = CategorieSerializer

    def get_permissions(self):
        # Cette méthode gère qui a le droit de faire quoi :
        # - Tout le monde peut voir la liste des catégories (list, retrieve)
        # - Seul le Gérant peut ajouter/modifier/supprimer
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        # Cette méthode définit quelles données on va chercher en base
        user = self.request.user
        if user.is_authenticated and user.role == 'GERANT':
            # Le gérant voit tout, même les catégories inactives
            return Categorie.objects.all().order_by('ordre_affichage', 'nom')
        # Les clients/serveurs ne voient que ce qui est actif
        return Categorie.objects.active().order_by('ordre_affichage', 'nom')

    def destroy(self, request, *args, **kwargs):
        # Quand on demande de supprimer une catégorie, on appelle notre méthode delete() personnalisée
        # (Soft Delete) au lieu de supprimer la ligne SQL.
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlatViewSet(viewsets.ModelViewSet):
    serializer_class = PlatSerializer

    def get_permissions(self):
        # Similaire aux catégories :
        # - Lecture publique pour le menu digital
        # - Modification réservée au Cuisinier ou au Gérant
        if self.action in ('list', 'retrieve', 'recommendations', 'top_recommendations'):
            return [AllowAny()]
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsCuisinierOrGerant()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        user = self.request.user
        # We only show active plats in the main list. 
        # Inactive plats are kept in DB for order history but hidden from the menu management.
        qs = Plat.objects.active()
        
        if not (user.is_authenticated and user.role in ['GERANT', 'CUISINIER']):
            # Clients only see available plats
            qs = qs.filter(est_disponible=True)
            
        # Filtre optionnel : ?categorie=ID
        categorie_id = self.request.query_params.get('categorie')
        if categorie_id:
            qs = qs.filter(categorie_id=categorie_id)
        return qs.order_by('categorie', 'nom')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # Action personnalisée : permet d'avoir une route spécifique /api/plats/ID/recommendations/
    # Très utile pour suggérer des produits complémentaires au client
    @action(detail=True, methods=['get'])
    def recommendations(self, request, pk=None):
        plat = self.get_object()
        # On essaye de récupérer les similarités calculées par l'IA (en cache)
        similarities = cache.get('plat_similarities') or {}
        recommended_ids = similarities.get(plat.id, [])

        if recommended_ids:
            plats = Plat.objects.active().filter(id__in=recommended_ids, est_disponible=True)
            plats_dict = {p.id: p for p in plats}
            ordered_plats = [plats_dict[rid] for rid in recommended_ids if rid in plats_dict]
            
            if ordered_plats:
                serializer = self.get_serializer(ordered_plats, many=True)
                return Response(serializer.data)

        # Si l'IA n'a rien trouvé, on suggère par défaut les 5 plats les plus populaires
        popular_plats = Plat.objects.active().filter(
            est_disponible=True
        ).exclude(
            id=plat.id
        ).annotate(
            lignes_count=Count('lignes_commande') # On compte le nombre de fois où le plat a été commandé
        ).order_by('-lignes_count', 'nom')[:5]

        serializer = self.get_serializer(popular_plats, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='top-recommendations')
    def top_recommendations(self, request):
        popular_plats = Plat.objects.active().filter(
            est_disponible=True
        ).annotate(
            lignes_count=Count('lignes_commande')
        ).order_by('-lignes_count', 'nom')[:4]
        
        serializer = self.get_serializer(popular_plats, many=True)
        return Response(serializer.data)
