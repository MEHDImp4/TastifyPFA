from rest_framework import serializers
from .models import LoyaltyProfile, LoyaltyTransaction, Reward

class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = LoyaltyTransaction
        fields = ['id', 'points', 'type', 'type_display', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class LoyaltyProfileSerializer(serializers.ModelSerializer):
    tier = serializers.ReadOnlyField()
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = LoyaltyProfile
        fields = ['id', 'username', 'points', 'tier', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = ['id', 'nom', 'description', 'points_requis', 'est_actif', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
