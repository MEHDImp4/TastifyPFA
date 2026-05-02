from django.db import transaction, models
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.permissions import IsGerant, IsServeurOrGerant, IsCuisinierOrGerant
from .models import Commande, CommandeLigne
from .serializers import CommandeSerializer, CommandeLigneSerializer


class CommandeViewSet(viewsets.ModelViewSet):
    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated, IsServeurOrGerant | IsCuisinierOrGerant]

    def get_queryset(self):
        user = self.request.user
        qs = (
            Commande.objects.active()
            .select_related('serveur', 'table')
            .prefetch_related(
                models.Prefetch('lignes', queryset=CommandeLigne.objects.select_related('plat'))
            )
        )

        table_id = self.request.query_params.get('table')
        if table_id:
            # Table-specific lookup: any staff member can see which order is on a given table
            qs = qs.filter(table_id=table_id)
        elif user.role == 'CUISINIER':
            # Cuisinier sees all orders currently in the kitchen
            qs = qs.filter(statut__in=[Commande.Statut.EN_COURS, Commande.Statut.EN_CUISINE])
        elif user.role != 'GERANT':
            # General list: only show the user's own orders
            qs = qs.filter(serveur=user)

        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)

        return qs

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def add_items(self, request, pk=None):
        """CMD-API-05: Add items to an existing order."""
        # Retrieve without user-scoping so we can give a 403 rather than a 404
        commande = get_object_or_404(
            Commande.objects.active().select_related('serveur'),
            pk=pk,
        )

        if commande.statut in [Commande.Statut.PAYEE, Commande.Statut.ANNULEE]:
            return Response(
                {"error": "Impossible d'ajouter des éléments à une commande payée ou annulée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only the order owner or a GERANT may modify it
        if commande.serveur != request.user and request.user.role != 'GERANT':
            return Response(
                {"error": "Vous n'êtes pas autorisé à modifier cette commande."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CommandeLigneSerializer(data=request.data, many=True)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save(commande=commande)
            
            # Re-serialize commande to return updated state
            full_serializer = self.get_serializer(commande)
            return Response(full_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """Soft delete — sets est_active=False instead of hard-deleting."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
