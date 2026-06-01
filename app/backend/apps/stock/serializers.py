from decimal import Decimal
from rest_framework import serializers
from .models import Ingredient, PlatIngredient, MouvementStock


class IngredientSerializer(serializers.ModelSerializer):
    stock_actuel = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0'))
    seuil_alerte = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0'))

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
    quantite_requise = serializers.DecimalField(max_digits=10, decimal_places=3, min_value=Decimal('0'))

    class Meta:
        model = PlatIngredient
        fields = [
            'id',
            'plat',
            'ingredient',
            'quantite_requise',
        ]
        read_only_fields = ['id']


class MouvementStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = MouvementStock
        fields = [
            'id',
            'ingredient',
            'quantite',
            'type_mouvement',
            'source',
            'commentaire',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
