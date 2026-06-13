from django.db import models
from rest_framework import viewsets, permissions
from .models import Avis
from .serializers import AvisSerializer
from .tasks import analyze_review_sentiment
from apps.users.permissions import IsGerant, IsClient
from core.pagination import OptInPageNumberPagination

class AvisViewSet(viewsets.ModelViewSet):
    serializer_class = AvisSerializer
    pagination_class = OptInPageNumberPagination

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Avis.objects.none()
        if user.role == 'GERANT':
            queryset = Avis.objects.select_related('user', 'plat', 'commande').all()
        else:
            queryset = Avis.objects.select_related('user', 'plat', 'commande').filter(user=user)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(commentaire__icontains=search)
                | models.Q(user__username__icontains=search)
                | models.Q(user__first_name__icontains=search)
                | models.Q(user__last_name__icontains=search)
                | models.Q(plat__nom__icontains=search)
            )

        return queryset.order_by('-created_at', '-id')

    def get_permissions(self):
        if self.action == 'create':
            return [IsClient()]
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        # Gerant can do anything else (update, delete)
        return [IsGerant()]

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        analyze_review_sentiment.delay(instance.id)
