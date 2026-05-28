import datetime
from urllib.parse import quote

from django.db.models import Prefetch
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.paiements.exceptions import AmbiguousPayableOrderError, NoPayableOrderError
from apps.paiements.services import resolve_payable_session
from apps.paiements.tokens import issue_payment_token
from apps.users.permissions import IsGerant
from .models import Table, PlanText
from .serializers import TableSerializer, PlanTextSerializer


# Ce fichier gère les actions sur les tables et le plan de salle.

# Prefetch est une optimisation : on demande à Django de récupérer les réservations
# du jour en même temps que les tables pour éviter de faire 50 requêtes à la base.
def _today_reservations_prefetch():
    from apps.reservations.models import Reservation
    today = datetime.date.today()
    return Prefetch(
        'reservations',
        queryset=Reservation.objects.active().filter(date_reservation=today),
        to_attr='_today_reservations',
    )


class TableViewSet(viewsets.ModelViewSet):
    serializer_class = TableSerializer

    def get_permissions(self):
        # - Tout le monde connecté peut voir le plan (Serveur, Cuisinier)
        # - Seul le Gérant peut modifier la position des tables
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        if self.action == 'qr':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        user = self.request.user
        prefetch = _today_reservations_prefetch()
        if user.is_authenticated and user.role == 'GERANT':
            return Table.objects.all().prefetch_related(prefetch).order_by('numero')
        return Table.objects.active().prefetch_related(prefetch).order_by('numero')

    def destroy(self, request, *args, **kwargs):
        # Soft delete pour les tables
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # Action personnalisée pour générer un QR Code de paiement
    # Cette route est appelée quand un serveur veut encaisser une table via un lien mobile
    @action(detail=True, methods=['get'], url_path='qr')
    def qr(self, request, *args, **kwargs):
        if request.user.role not in ('SERVEUR', 'GERANT'):
            return Response(
                {'detail': "Vous n'êtes pas autorisé à générer ce QR."},
                status=status.HTTP_403_FORBIDDEN,
            )

        table = self.get_object()
        try:
            # On cherche s'il y a une commande en cours sur cette table qui doit être payée
            session = resolve_payable_session(table_id=table.id)
        except NoPayableOrderError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except AmbiguousPayableOrderError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_409_CONFLICT)

        # On génère un "Token" (une clé secrète temporaire) pour sécuriser le lien de paiement
        token = issue_payment_token(table_id=session.table_id, commande_id=session.commande_id)
        
        from django.conf import settings
        base_url = settings.FRONTEND_BASE_URL.rstrip('/')
        full_url = f"{base_url}/pay/{quote(token, safe='')}"

        return Response(
            {
                'table_id': session.table_id,
                'commande_id': session.commande_id,
                'token': token,
                'payment_url': full_url,
            }
        )

class PlanTextViewSet(viewsets.ModelViewSet):
    serializer_class = PlanTextSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGerant()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'GERANT':
            return PlanText.objects.all()
        return PlanText.objects.active()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
