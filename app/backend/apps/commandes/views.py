from django.db import transaction, models
from django.shortcuts import get_object_or_404
from django.db.models.functions import Coalesce
from rest_framework import viewsets, status, mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

import logging
logger = logging.getLogger(__name__)

from apps.users.permissions import IsClient, IsGerant, IsServeurOrGerant, IsCuisinierOrGerant
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
            
            if new_statut == CommandeLigne.Statut.ANNULE:
                if instance.statut not in [CommandeLigne.Statut.EN_ATTENTE]:
                    return Response(
                        {"error": "Impossible d'annuler un plat déjà en préparation ou servi."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif new_statut != CommandeLigne.Statut.SERVI:
                return Response(
                    {"error": "Le serveur ne peut que marquer un plat comme servi ou l'annuler (si non démarré)."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if new_statut == CommandeLigne.Statut.SERVI and instance.statut != CommandeLigne.Statut.PRET:
                return Response(
                    {"error": "Un plat doit être prêt avant d'être marqué comme servi."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Deduction if manually starting preparation (Phase 20 parity)
        if new_statut == CommandeLigne.Statut.EN_PREPARATION and instance.statut == CommandeLigne.Statut.EN_ATTENTE:
            try:
                StockService.deduct_ingredients_for_plat(instance.plat, instance.quantite)
            except InsufficientStockError as e:
                logger.error(f"Stock deduction failed during manual prep: {str(e)}")

        response = super().partial_update(request, *args, **kwargs)

        if response.status_code == 200:
            from core.realtime import broadcast_staff_event
            instance.refresh_from_db()
            
            if new_statut == CommandeLigne.Statut.PRET:
                broadcast_staff_event(
                    event_type='line_ready',
                    payload={
                        'ligne_id': instance.id,
                        'plat_nom': instance.plat.nom,
                        'commande_id': instance.commande_id,
                        'table_numero': instance.commande.table.numero,
                    },
                )
            elif new_statut == CommandeLigne.Statut.ANNULE:
                broadcast_staff_event(
                    event_type='line_cancelled',
                    payload={
                        'ligne_id': instance.id,
                        'commande_id': instance.commande_id,
                    },
                )

        return response


class CommandeViewSet(viewsets.ModelViewSet):
    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated, IsServeurOrGerant | IsCuisinierOrGerant | IsClient]

    def get_queryset(self):
        user = self.request.user
        statut = self.request.query_params.get('statut')
        scope = self.request.query_params.get('scope')
        kitchen_statuses = [Commande.Statut.EN_CUISINE, Commande.Statut.PRETE]
        qs = (
            Commande.objects.active()
            .select_related('serveur', 'table')
            .prefetch_related(
                models.Prefetch('lignes', queryset=CommandeLigne.objects.select_related('plat'))
            )
            .annotate(
                completed_paid_total=Coalesce(
                    models.Sum(
                        'paiements__montant',
                        filter=models.Q(paiements__statut='COMPLETE'),
                    ),
                    models.Value(0),
                    output_field=models.DecimalField(max_digits=10, decimal_places=2),
                )
            )
        )

        table_id = self.request.query_params.get('table')
        if table_id and user.role != 'CLIENT':
            # Table-specific lookup: any staff member can see which order is on a given table.
            # We exclude terminal statuses (PAYEE, ANNULEE) so that a newly 'freed' table 
            # doesn't show the previous order.
            qs = qs.filter(table_id=table_id).exclude(
                statut__in=[Commande.Statut.PAYEE, Commande.Statut.ANNULEE]
            )
        elif scope == 'kitchen' and user.role in ['CUISINIER', 'GERANT']:
            qs = qs.filter(statut__in=kitchen_statuses).exclude(
                completed_paid_total__gte=models.F('montant_total')
            )
        elif user.role == 'CUISINIER':
            # Phase 16: KDS shows only fired tickets. Manual-fire workflow flips
            # EN_COURS -> EN_CUISINE via PATCH; only EN_CUISINE and PRETE are
            # actionable for the kitchen. Drafts (EN_COURS) stay invisible until
            # a server explicitly fires them.
            qs = qs.filter(statut__in=kitchen_statuses).exclude(
                completed_paid_total__gte=models.F('montant_total')
            )
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
        if request.user.role == 'CLIENT' and not kwargs.get('partial', False):
            return Response(
                {"error": "Les clients ne peuvent pas remplacer une commande existante."},
                status=status.HTTP_403_FORBIDDEN,
            )

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

        if request.user.role == 'CLIENT':
            requested_fields = set(request.data.keys())
            if requested_fields != {'statut'}:
                return Response(
                    {"error": "Les clients ne peuvent que lancer leur commande a emporter."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if (
                instance.type != Commande.Type.EMPORTER
                or request.data.get('statut') != Commande.Statut.EN_CUISINE
                or instance.statut != Commande.Statut.EN_COURS
            ):
                return Response(
                    {"error": "Seule une commande a emporter en brouillon peut etre envoyee en cuisine."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Phase 20: stock deduction when firing an order
        new_statut = request.data.get('statut')
        if new_statut == Commande.Statut.EN_CUISINE and instance.statut == Commande.Statut.EN_COURS:
            lignes_to_deduct = instance.lignes.filter(statut=CommandeLigne.Statut.EN_ATTENTE)
            for ligne in lignes_to_deduct:
                try:
                    StockService.deduct_ingredients_for_plat(ligne.plat, ligne.quantite)
                except InsufficientStockError as e:
                    logger.error(f"Stock deduction failed during order fire: {str(e)}")

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
            with transaction.atomic():
                new_lignes = serializer.save(commande=commande)
                # Phase 20: If already fired, deduct stock for new items
                if commande.statut == Commande.Statut.EN_CUISINE:
                    for ligne in new_lignes:
                        try:
                            StockService.deduct_ingredients_for_plat(ligne.plat, ligne.quantite)
                        except InsufficientStockError as e:
                            logger.error(f"Stock deduction failed during add_items: {str(e)}")

                KdsOrchestrator.schedule_reorchestration_after_commit(commande.pk)
            
            # Re-serialize commande to return updated state
            full_serializer = self.get_serializer(commande)
            return Response(full_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """Soft delete — sets est_active=False instead of hard-deleting."""
        if request.user.role == 'CLIENT':
            return Response(
                {"error": "Les clients ne peuvent pas supprimer une commande."},
                status=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
