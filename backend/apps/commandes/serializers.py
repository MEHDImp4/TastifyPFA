from django.db import transaction
from rest_framework import serializers
from .models import Commande, CommandeLigne
from apps.menu.models import Plat


class CommandeLigneSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommandeLigne
        fields = [
            'id',
            'plat',
            'quantite',
            'prix_unitaire',
            'statut',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'prix_unitaire', 'created_at', 'updated_at']


class CommandeSerializer(serializers.ModelSerializer):
    lignes = CommandeLigneSerializer(many=True)

    class Meta:
        model = Commande
        fields = [
            'id',
            'table',
            'serveur',
            'statut',
            'montant_total',
            'est_active',
            'created_at',
            'updated_at',
            'lignes',
        ]
        read_only_fields = ['id', 'serveur', 'montant_total', 'created_at', 'updated_at']

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        request = self.context.get('request')
        serveur = request.user if request else None

        with transaction.atomic():
            commande = Commande.objects.create(serveur=serveur, **validated_data)
            for ligne_data in lignes_data:
                CommandeLigne.objects.create(commande=commande, **ligne_data)
        
        return commande
