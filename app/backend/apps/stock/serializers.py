from rest_framework import serializers
from .models import Ingredient, PlatIngredient


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = [
            'id',
            'nom',
            'unite_mesure',
            'stock_actuel',
            'seuil_alerte',
            'est_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlatIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatIngredient
        fields = [
            'id',
            'plat',
            'ingredient',
            'quantite_requise',
        ]
        read_only_fields = ['id']
