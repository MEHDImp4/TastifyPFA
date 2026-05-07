from django.db import transaction, models
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.permissions import IsGerant, IsServeurOrGerant, IsCuisinierOrGerant
from apps.stock.services import StockService, InsufficientStockError
from .models import Commande, CommandeLigne
from .serializers import CommandeSerializer, CommandeLigneSerializer
from .services.orchestrator import KdsOrchestrator


class CommandeLigneViewSet(mixins.UpdateModelMixin, viewsets.GenericViewSet):
    queryset = CommandeLigne.objects.all()
    serializer_class = CommandeLigneSerializer
    permission_classes = [IsAuthenticated, IsCuisinierOrGerant | IsServeurOrGerant]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_statut = request.data.get('statut')
        user = request.user

        if not new_statut:
            return super().partial_update(request, *args, **kwargs)

        # Role-based status transition logic
        if user.role == 'CUISINIER':
            allowed = [CommandeLigne.Statut.EN_PREPARATION, CommandeLigne.Statut.PRET]
            if new_statut not in allowed:
                return Response(
                    {"error": "Le cuisinier ne peut que marquer un plat en préparation ou prêt."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif user.role == 'SERVEUR':
            if instance.commande.serveur != user:
                return Response(
                    {"error": "Vous n'êtes pas le serveur assigné à cette commande."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if new_statut != CommandeLigne.Statut.SERVI:
                return Response(
                    {"error": "Le serveur ne peut que marquer un plat comme servi."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if instance.statut != CommandeLigne.Statut.PRET:
                return Response(
                    {"error": "Un plat doit être prêt avant d'être marqué comme servi."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Deduct ingredients if manually starting preparation (Phase 20 parity)
        if new_statut == CommandeLigne.Statut.EN_PREPARATION and instance.statut == CommandeLigne.Statut.EN_ATTENTE:
            try:
                with transaction.atomic():
                    StockService.deduct_ingredients_for_plat(instance.plat, instance.quantite)
            except InsufficientStockError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response = super().partial_update(request, *args, **kwargs)

        if new_statut == CommandeLigne.Statut.PRET and response.status_code == 200:
            from core.realtime import broadcast_staff_event
            instance.refresh_from_db()
            broadcast_staff_event(
                event_type='line_ready',
                payload={
                    'ligne_id': instance.id,
                    'plat_nom': instance.plat.nom,
                    'commande_id': instance.commande_id,
                    'table_numero': instance.commande.table.numero,
                },
            )

        return response


class CommandeViewSet(viewsets.ModelViewSet):
    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated, IsServeurOrGerant | IsCuisinierOrGerant]

    def get_queryset(self):
        user = self.request.user
        statut = self.request.query_params.get('statut')
        scope = self.request.query_params.get('scope')
        qs = (
            Commande.objects.active()
            .select_related('serveur', 'table')
            .prefetch_related(
                models.Prefetch('lignes', queryset=CommandeLigne.objects.select_related('plat'))
            )
        )

        table_id = self.request.query_params.get('table')
        if table_id:
            # Table-specific lookup: any staff member can see which order is on a given table.
            # We exclude terminal statuses (PAYEE, ANNULEE) so that a newly 'freed' table 
            # doesn't show the previous order.
            qs = qs.filter(table_id=table_id).exclude(
                statut__in=[Commande.Statut.PAYEE, Commande.Statut.ANNULEE]
            )
        elif scope == 'kitchen':
            kitchen_statuses = [Commande.Statut.EN_CUISINE, Commande.Statut.PRETE]
            qs = qs.filter(statut__in=kitchen_statuses)
        elif user.role == 'CUISINIER':
            # Phase 16: KDS shows only fired tickets. Manual-fire workflow flips
            # EN_COURS -> EN_CUISINE via PATCH; only EN_CUISINE and PRETE are
            # actionable for the kitchen. Drafts (EN_COURS) stay invisible until
            # a server explicitly fires them.
            kitchen_statuses = [Commande.Statut.EN_CUISINE, Commande.Statut.PRETE]
            qs = qs.filter(statut__in=kitchen_statuses)
        elif user.role != 'GERANT':
            # General list: only show the user's own orders
            qs = qs.filter(serveur=user)

        if statut:
            qs = qs.filter(statut=statut)

        return qs

    def perform_create(self, serializer):
        serializer.save()

    def _check_ownership_or_cuisinier_ready(self, request, instance):
        """Helper to enforce Phase 16/17 ownership & role rules."""
        # Phase 17: Allow Cuisinier to mark as PRETE
        is_cuisinier_ready = (
            request.user.role == 'CUISINIER' and 
            request.data.get('statut') == Commande.Statut.PRETE
        )
        
        if not is_cuisinier_ready and instance.serveur != request.user and request.user.role != 'GERANT':
            return False
        return True

    def update(self, request, *args, **kwargs):
        """Phase 16 & 17: ownership rules for PUT."""
        instance = get_object_or_404(Commande.objects.active(), pk=kwargs.get('pk'))
        if not self._check_ownership_or_cuisinier_ready(request, instance):
            return Response(
                {"error": "Vous n'êtes pas autorisé à modifier cette commande."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Phase 16 & 17: ownership rules for PATCH."""
        instance = get_object_or_404(Commande.objects.active(), pk=kwargs.get('pk'))
        if not self._check_ownership_or_cuisinier_ready(request, instance):
            return Response(
                {"error": "Vous n'êtes pas autorisé à modifier cette commande."},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        # Phase 20/28: Immediate stock deduction when firing an order
        new_statut = request.data.get('statut')
        if new_statut == Commande.Statut.EN_CUISINE and instance.statut == Commande.Statut.EN_COURS:
            try:
                with transaction.atomic():
                    for ligne in instance.lignes.filter(statut=CommandeLigne.Statut.EN_ATTENTE):
                        StockService.deduct_ingredients_for_plat(ligne.plat, ligne.quantite)
            except InsufficientStockError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return super().partial_update(request, *args, **kwargs)

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
            try:
                with transaction.atomic():
                    new_lignes = serializer.save(commande=commande)
                    # Phase 20/28: If already fired, deduct stock for new items immediately
                    if commande.statut == Commande.Statut.EN_CUISINE:
                        for ligne in new_lignes:
                            StockService.deduct_ingredients_for_plat(ligne.plat, ligne.quantite)
                    
                    KdsOrchestrator.schedule_reorchestration_after_commit(commande.pk)
            except InsufficientStockError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
            # Re-serialize commande to return updated state
            full_serializer = self.get_serializer(commande)
            return Response(full_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """Soft delete — sets est_active=False instead of hard-deleting."""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
