from rest_framework import serializers
from .models import Avis


class AvisSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Avis
        fields = [
            'id', 'user', 'username', 'plat', 'commande',
            'commentaire', 'note', 'sentiment_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'sentiment_score', 'created_at', 'updated_at']
