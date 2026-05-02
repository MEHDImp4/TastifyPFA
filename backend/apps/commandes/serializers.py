from django.db import transaction
from rest_framework import serializers
from .models import Commande, CommandeLigne
from .services.orchestrator import KdsOrchestrator
from apps.menu.models import Plat


class CommandeLigneSerializer(serializers.ModelSerializer):
    plat_details = serializers.SerializerMethodField()

    class Meta:
        model = CommandeLigne
        fields = [
            'id',
            'plat',
            'plat_details',
            'quantite',
            'prix_unitaire',
            'statut',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'plat_details', 'prix_unitaire', 'created_at', 'updated_at']

    def get_plat_details(self, obj):
        return {
            "id": obj.plat.id,
            "nom": obj.plat.nom,
            "prix": obj.plat.prix,
        }


class CommandeSerializer(serializers.ModelSerializer):
    lignes = CommandeLigneSerializer(many=True)
    serveur_name = serializers.SerializerMethodField()
    serveur_username = serializers.ReadOnlyField(source='serveur.username')

    class Meta:
        model = Commande
        fields = [
            'id',
            'table',
            'serveur',
            'serveur_name',
            'serveur_username',
            'statut',
            'montant_total',
            'est_active',
            'created_at',
            'updated_at',
            'lignes',
        ]
        read_only_fields = ['id', 'serveur', 'serveur_name', 'serveur_username', 'montant_total', 'created_at', 'updated_at']

    def get_serveur_name(self, obj):
        if obj.serveur:
            full_name = f"{obj.serveur.first_name} {obj.serveur.last_name}".strip()
            return full_name or obj.serveur.username
        return None

    def validate_table(self, value):
        """
        CMD-API-04: Ensure the table is not already OCCUPEE when creating a new order.
        """
        # We only check for new orders (POST)
        request = self.context.get('request')
        if request and request.method == 'POST':
            from apps.tables.models import Table
            if value.statut == Table.Statut.OCCUPEE:
                raise serializers.ValidationError(
                    "Cette table est déjà occupée par une autre commande."
                )
        return value

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        request = self.context.get('request')
        serveur = request.user if request else None

        with transaction.atomic():
            commande = Commande.objects.create(serveur=serveur, **validated_data)
            for ligne_data in lignes_data:
                CommandeLigne.objects.create(commande=commande, **ligne_data)
            if lignes_data:
                KdsOrchestrator.schedule_reorchestration_after_commit(commande.pk)

        return commande
