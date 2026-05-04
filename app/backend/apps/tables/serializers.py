from rest_framework import serializers
from .models import Table


class TableSerializer(serializers.ModelSerializer):

    est_active = serializers.BooleanField(default=True)

    class Meta:
        model = Table
        fields = [
            'id',
            'numero',
            'capacite',
            'statut',
            'pos_x',
            'pos_y',
            'est_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
