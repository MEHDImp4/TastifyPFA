from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction

from apps.users.permissions import IsGerant, IsServeurOrGerant
from .models import Commande, CommandeLigne
from .serializers import CommandeSerializer, CommandeLigneSerializer


class CommandeViewSet(viewsets.ModelViewSet):
    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated, IsServeurOrGerant]

    def get_queryset(self):
        """
        D-11: SERVEUR users only see their own orders.
        GERANT users see all orders.
        Only active orders are shown by default.
        """
        user = self.request.user
        qs = Commande.objects.active()

        if user.role == 'GERANT':
            return qs
        
        return qs.filter(serveur=user)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def add_items(self, request, pk=None):
        """
        CMD-API-05: Add items to an existing order.
        Expects a list of lines in the request body.
        """
        commande = self.get_object()
        
        # Validation: prevent adding items to terminal orders
        if commande.statut in [Commande.Statut.PAYEE, Commande.Statut.ANNULEE]:
            return Response(
                {"error": "Impossible d'ajouter des éléments à une commande payée ou annulée."},
                status=status.HTTP_400_BAD_REQUEST
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
