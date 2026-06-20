from rest_framework import serializers
from apps.commandes.models import CommandeLigne
from apps.paiements.models import Paiement, PaiementItem
from .models import Avis


class AvisSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    note = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=5)

    class Meta:
        model = Avis
        fields = [
            'id', 'user', 'username', 'plat', 'commande',
            'commentaire', 'note', 'sentiment_score', 'lang_code',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'sentiment_score', 'lang_code', 'created_at', 'updated_at']

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        commande = attrs.get('commande')
        plat = attrs.get('plat')

        if not user or not user.is_authenticated or getattr(user, 'role', None) != 'CLIENT':
            raise serializers.ValidationError("Seul un client connecté peut publier un avis.")

        if commande is None or plat is None:
            raise serializers.ValidationError("L'avis doit être lié à une commande payée et à un plat.")

        if Avis.objects.filter(user=user, commande=commande, plat=plat).exists():
            raise serializers.ValidationError("Vous avez déjà donné votre avis sur ce plat pour cette commande.")

        paid_payments = Paiement.objects.completed().filter(commande=commande, client=user)
        if not paid_payments.exists():
            raise serializers.ValidationError("Vous devez payer cette commande avant de donner un avis.")

        plat_in_commande = CommandeLigne.objects.filter(commande=commande, plat=plat).exists()
        if not plat_in_commande:
            raise serializers.ValidationError("Ce plat ne fait pas partie de cette commande.")

        paid_all_or_share = paid_payments.filter(items__isnull=True).exists()
        paid_item = PaiementItem.objects.filter(
            paiement__in=paid_payments,
            commande_ligne__commande=commande,
            commande_ligne__plat=plat,
        ).exists()

        if not (paid_all_or_share or paid_item):
            raise serializers.ValidationError("Vous ne pouvez noter que les plats que vous avez payés.")

        return attrs
