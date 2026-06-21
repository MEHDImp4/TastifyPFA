from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import LoyaltyProfile, LoyaltyTransaction, Reward
from .serializers import LoyaltyProfileSerializer, LoyaltyTransactionSerializer, RewardSerializer
from apps.users.permissions import IsClient, IsGerant

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
    serializer_class = RewardSerializer

    def get_queryset(self):
        queryset = Reward.objects.all().order_by('points_requis', 'nom')
        if self.request.user.role == 'GERANT':
            return queryset
        return queryset.filter(est_actif=True)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsGerant()]
        if self.action == 'redeem':
            return [IsClient()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def redeem(self, request, pk=None):
        reward = self.get_object()
        with transaction.atomic():
            profile, _ = LoyaltyProfile.objects.select_for_update().get_or_create(user=request.user)

            if profile.points < reward.points_requis:
                return Response(
                    {"detail": "Points insuffisants."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            profile.points -= reward.points_requis
            profile.save(update_fields=['points', 'updated_at'])

            LoyaltyTransaction.objects.create(
                profile=profile,
                points=-reward.points_requis,
                type=LoyaltyTransaction.Type.DEPENSE,
                description=f"Récompense échangée : {reward.nom}"
            )

        return Response({"detail": f"Récompense '{reward.nom}' réclamée avec succès !"})
