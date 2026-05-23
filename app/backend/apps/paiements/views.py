from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .exceptions import InvalidTokenError, NoPayableOrderError, AmbiguousPayableOrderError
from .models import Paiement
from .serializers import (
    TokenResolveSerializer,
    SessionPayableSerializer,
    EqualSplitPreviewSerializer,
    EqualSplitResponseSerializer,
    ItemSplitPreviewSerializer,
    ItemSplitResponseSerializer,
    TokenBackedPaymentSerializer,
    ManualPaymentSerializer,
    PaiementSerializer,
)
from .services import (
    resolve_payable_session,
    preview_equal_split_for_table,
    validate_item_contributions,
    create_payment,
    reconcile_commande_payment_status,
)
from .tokens import validate_payment_token
from .permissions import HasValidPaymentToken


class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.all().order_by('-created_at')
    serializer_class = PaiementSerializer

    def get_permissions(self):
        if self.action in ('resolve', 'equal_split', 'item_split', 'pay_token'):
            return [AllowAny()]  # Token check is done via HasValidPaymentToken or inside the action
        return [IsAuthenticated()]

    @action(detail=False, methods=['get', 'post'], url_path='session/resolve')
    def resolve(self, request):
        payload_source = request.query_params if request.method == 'GET' else request.data
        serializer = TokenResolveSerializer(data=payload_source)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']

        try:
            payload = validate_payment_token(token)
            table_id = payload['table_id']
            session = resolve_payable_session(table_id=table_id)
            
            # Cross-check: ensure the commande_id in token still matches the current payable session
            if session.commande_id != payload['commande_id']:
                raise InvalidTokenError("Ce jeton n'est plus valide pour cette table.")

            response_serializer = SessionPayableSerializer(session)
            return Response(response_serializer.data)
        except (InvalidTokenError, NoPayableOrderError, AmbiguousPayableOrderError) as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='session/staff-resolve')
    def staff_resolve(self, request):
        table_id = request.query_params.get('table_id')
        if not table_id:
            return Response({'detail': 'table_id est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = resolve_payable_session(table_id=table_id)
            response_serializer = SessionPayableSerializer(session)
            return Response(response_serializer.data)
        except (NoPayableOrderError, AmbiguousPayableOrderError) as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='session/equal-split')
    def equal_split(self, request):
        token_serializer = TokenResolveSerializer(data=request.data)
        token_serializer.is_valid(raise_exception=True)
        token = token_serializer.validated_data['token']
        
        preview_serializer = EqualSplitPreviewSerializer(data=request.data)
        preview_serializer.is_valid(raise_exception=True)
        split_count = preview_serializer.validated_data['split_count']

        try:
            payload = validate_payment_token(token)
            preview = preview_equal_split_for_table(
                table_id=payload['table_id'],
                share_count=split_count
            )
            
            # Cross-check
            if preview.commande_id != payload['commande_id']:
                raise InvalidTokenError("Ce jeton n'est plus valide.")

            response_serializer = EqualSplitResponseSerializer(preview)
            return Response(response_serializer.data)
        except (InvalidTokenError, NoPayableOrderError, AmbiguousPayableOrderError) as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='session/item-split')
    def item_split(self, request):
        token_serializer = TokenResolveSerializer(data=request.data)
        token_serializer.is_valid(raise_exception=True)
        token = token_serializer.validated_data['token']
        
        preview_serializer = ItemSplitPreviewSerializer(data=request.data)
        preview_serializer.is_valid(raise_exception=True)
        contributions = preview_serializer.validated_data['contributions']

        try:
            payload = validate_payment_token(token)
            validation = validate_item_contributions(
                commande_id=payload['commande_id'],
                contributions=contributions
            )
            
            response_serializer = ItemSplitResponseSerializer(validation)
            return Response(response_serializer.data)
        except (InvalidTokenError, NoPayableOrderError) as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='session/pay')
    def pay_token(self, request):
        serializer = TokenBackedPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        montant = serializer.validated_data['montant']
        reference = serializer.validated_data['reference_transaction']
        contributions = serializer.validated_data.get('contributions', [])

        try:
            payload = validate_payment_token(token)
            commande_id = payload['commande_id']
            
            client = request.user if request.user.is_authenticated and request.user.role == 'CLIENT' else None

            paiement = create_payment(
                commande_id=commande_id,
                montant=montant,
                methode=Paiement.Methode.QR,
                statut=Paiement.Statut.COMPLETE,
                reference_transaction=reference,
                contributions=contributions,
                client=client
            )
            
            reconcile_commande_payment_status(commande_id=commande_id)
            
            return Response(PaiementSerializer(paiement).data, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request, *args, **kwargs):
        """Staff manual payment creation."""
        serializer = ManualPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        commande = serializer.validated_data['commande']
        client = serializer.validated_data.get('client')
        montant = serializer.validated_data['montant']
        methode = serializer.validated_data['methode']
        reference = serializer.validated_data.get('reference_transaction', '')
        contributions = serializer.validated_data.get('contributions', [])

        try:
            paiement = create_payment(
                commande_id=commande.id,
                montant=montant,
                methode=methode,
                statut=Paiement.Statut.COMPLETE,
                reference_transaction=reference,
                contributions=contributions,
                client=client
            )
            
            reconcile_commande_payment_status(commande_id=commande.id)
            
            return Response(PaiementSerializer(paiement).data, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
