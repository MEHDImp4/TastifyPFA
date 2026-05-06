from rest_framework import serializers
from .models import Paiement, PaiementItem


class TokenResolveSerializer(serializers.Serializer):
    token = serializers.CharField()


class SessionPayableSerializer(serializers.Serializer):
    table_id = serializers.IntegerField()
    commande_id = serializers.IntegerField()
    montant_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    montant_paye = serializers.DecimalField(max_digits=10, decimal_places=2)
    montant_restant = serializers.DecimalField(max_digits=10, decimal_places=2)
    items = serializers.ListField(child=serializers.DictField())


class EqualSplitPreviewSerializer(serializers.Serializer):
    split_count = serializers.IntegerField(min_value=1)


class EqualSplitResponseSerializer(serializers.Serializer):
    commande_id = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    share_count = serializers.IntegerField()
    share_amounts = serializers.ListField(
        child=serializers.DecimalField(max_digits=10, decimal_places=2)
    )


class ItemContributionSerializer(serializers.Serializer):
    commande_ligne_id = serializers.IntegerField()
    montant_contribue = serializers.DecimalField(max_digits=10, decimal_places=2)


class ItemSplitPreviewSerializer(serializers.Serializer):
    contributions = ItemContributionSerializer(many=True)


class ContributionPreviewSerializer(serializers.Serializer):
    commande_ligne_id = serializers.IntegerField()
    montant_contribue = serializers.DecimalField(max_digits=10, decimal_places=2)
    montant_deja_couvert = serializers.DecimalField(max_digits=10, decimal_places=2)
    montant_restant_ligne = serializers.DecimalField(max_digits=10, decimal_places=2)


class ItemSplitResponseSerializer(serializers.Serializer):
    commande_id = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    contributions = ContributionPreviewSerializer(many=True)


class TokenBackedPaymentSerializer(serializers.Serializer):
    token = serializers.CharField()
    montant = serializers.DecimalField(max_digits=10, decimal_places=2)
    reference_transaction = serializers.CharField()
    contributions = ItemContributionSerializer(many=True, required=False)


class ManualPaymentSerializer(serializers.ModelSerializer):
    contributions = ItemContributionSerializer(many=True, required=False)

    class Meta:
        model = Paiement
        fields = [
            'id', 'commande', 'montant', 'methode', 
            'reference_transaction', 'contributions', 
            'statut', 'created_at'
        ]
        read_only_fields = ['id', 'statut', 'created_at']

    def validate_methode(self, value):
        if value == Paiement.Methode.QR:
            raise serializers.ValidationError(
                "La méthode QR est réservée au paiement par QR/token."
            )
        return value


class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = '__all__'
