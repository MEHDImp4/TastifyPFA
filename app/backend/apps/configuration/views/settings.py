from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import RestaurantConfiguration
from ..serializers import RestaurantConfigurationSerializer
from apps.users.permissions import IsGerant

class RestaurantConfigurationViewSet(viewsets.ModelViewSet):
    queryset = RestaurantConfiguration.objects.all()
    serializer_class = RestaurantConfigurationSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'public']:
            return [permissions.AllowAny()]
        return [IsGerant()]

    def list(self, request, *args, **kwargs):
        # Always return the solo object
        instance = RestaurantConfiguration.get_solo()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def get_object(self):
        return RestaurantConfiguration.get_solo()

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def public(self, request):
        instance = RestaurantConfiguration.get_solo()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
