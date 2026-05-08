from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import LoyaltyProfile, LoyaltyTransaction, Reward
from .serializers import LoyaltyProfileSerializer, LoyaltyTransactionSerializer, RewardSerializer
from apps.users.permissions import IsGerant

class LoyaltyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for clients to view their loyalty status.
    """
    serializer_class = LoyaltyProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Clients only see their own profile. Managers can see all (for search)
        if self.request.user.role == 'GERANT':
            return LoyaltyProfile.objects.all()
        return LoyaltyProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_status(self, request):
        profile, created = LoyaltyProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def transactions(self, request):
        profile, created = LoyaltyProfile.objects.get_or_create(user=request.user)
        transactions = LoyaltyTransaction.objects.filter(profile=profile).order_by('-created_at')
        serializer = LoyaltyTransactionSerializer(transactions, many=True)
        return Response(serializer.data)


class RewardViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing rewards.
    Managers: CRUD.
    Clients: List available rewards.
    """
    queryset = Reward.objects.filter(est_actif=True)
    serializer_class = RewardSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsGerant()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def redeem(self, request, pk=None):
        reward = self.get_object()
        profile, created = LoyaltyProfile.objects.get_or_create(user=request.user)

        if profile.points < reward.points_requis:
            return Response(
                {"detail": "Points insuffisants."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Atomic deduction
        profile.points -= reward.points_requis
        profile.save()

        # Log transaction
        LoyaltyTransaction.objects.create(
            profile=profile,
            points=-reward.points_requis,
            type='REDEEM',
            description=f"Échange contre : {reward.nom}"
        )

        return Response({"detail": f"Récompense '{reward.nom}' réclamée avec succès !"})
