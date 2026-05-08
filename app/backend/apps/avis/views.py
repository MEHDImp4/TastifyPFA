from rest_framework import viewsets, permissions
from .models import Avis
from .serializers import AvisSerializer
from .tasks import analyze_review_sentiment
from apps.users.permissions import IsGerant, IsClient

class AvisViewSet(viewsets.ModelViewSet):
    serializer_class = AvisSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Avis.objects.none()
        if user.role == 'GERANT':
            return Avis.objects.all()
        return Avis.objects.filter(user=user)

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
