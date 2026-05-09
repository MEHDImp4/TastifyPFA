from django.db import transaction
from rest_framework import serializers
from .models import Commande, CommandeLigne
from .services.orchestrator import KdsOrchestrator
from apps.menu.models import Plat


class CommandeLigneSerializer(serializers.ModelSerializer):
    plat_details = serializers.SerializerMethodField()
    quantite = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(max_length=2000, allow_blank=True, required=False)

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
            'type',
            'client_nom',
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

    def validate(self, attrs):
        """
        Custom validation to ensure table is provided for SUR_PLACE orders
        and not required for EMPORTER orders.
        """
        request = self.context.get('request')
        instance = getattr(self, 'instance', None)
        order_type = attrs.get('type', getattr(instance, 'type', Commande.Type.SUR_PLACE))
        table = attrs.get('table', getattr(instance, 'table', None))
        client_nom = attrs.get('client_nom', getattr(instance, 'client_nom', None))

        if request and request.user.is_authenticated and request.user.role == 'CLIENT':
            if order_type != Commande.Type.EMPORTER:
                raise serializers.ValidationError(
                    {"type": "Les clients ne peuvent creer que des commandes a emporter."}
                )

        if order_type == Commande.Type.SUR_PLACE and not table:
            raise serializers.ValidationError({"table": "Une table est requise pour une commande sur place."})

        if order_type == Commande.Type.EMPORTER and not client_nom:
            raise serializers.ValidationError({"client_nom": "Le nom du client est requis pour le retrait."})
        
        return attrs

    def validate_table(self, value):
        """
        CMD-API-04: Ensure the table is not already OCCUPEE when creating a new order.
        """
        # value can be None for EMPORTER
        if not value:
            return value

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
