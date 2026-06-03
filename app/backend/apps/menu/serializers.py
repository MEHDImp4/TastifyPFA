from decimal import Decimal
from rest_framework import serializers
from .models import Categorie, Plat
from apps.avis.models import Avis
from urllib.parse import urlparse


# Les Serializers du Menu servent à transformer les données SQL en format JSON pour le frontend.

class AvisMinimalSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = Avis
        fields = ['id', 'user_username', 'commentaire', 'note', 'sentiment_score', 'created_at']


class CategorieSerializer(serializers.ModelSerializer):
    # On précise comment gérer le champ image pour qu'il renvoie une URL propre
    image = serializers.ImageField(
        max_length=None,
        use_url=True,
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Categorie
        # Liste des champs que l'on veut exposer dans l'API
        fields = [
            'id',
            'nom',
            'description',
            'ordre_affichage',
            'image',
            'est_active',
            'created_at',
            'updated_at',
        ]
        # Certains champs sont gérés automatiquement par Django et ne doivent pas être modifiés par l'utilisateur
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        # Cette méthode permet de personnaliser la sortie JSON finale
        ret = super().to_representation(instance)
        if ret.get('image'):
            image_url = ret['image']
            # On s'assure que le chemin de l'image est relatif pour éviter les problèmes de domaine
            if image_url.startswith('http'):
                ret['image'] = urlparse(image_url).path
        return ret


class PlatSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(
        max_length=None,
        use_url=True,
        allow_null=True,
        required=False,
    )
    # On utilise PrimaryKeyRelatedField pour lier le plat à l'ID d'une catégorie existante
    categorie = serializers.PrimaryKeyRelatedField(queryset=Categorie.objects.all())
    
    # On ajoute des validations simples (ex: prix positif)
    prix = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0'))
    temps_preparation = serializers.IntegerField(min_value=1)

    # Champs calculés simplement pour afficher les avis dans le frontend.
    sentiment_score = serializers.SerializerMethodField()
    top_avis = serializers.SerializerMethodField()

    class Meta:
        model = Plat
        fields = [
            'id',
            'categorie',
            'nom',
            'description',
            'prix',
            'temps_preparation',
            'image',
            'est_disponible',
            'est_active',
            'sentiment_score',
            'top_avis',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sentiment_score', 'top_avis']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get('image'):
            image_url = ret['image']
            if image_url.startswith('http'):
                ret['image'] = urlparse(image_url).path
        return ret

    def get_sentiment_score(self, instance):
        avis = Avis.objects.filter(plat=instance, sentiment_score__isnull=False)
        scores = [item.sentiment_score for item in avis]

        if not scores:
            return 0.0

        return sum(scores) / len(scores)

    def get_top_avis(self, instance):
        derniers_avis = Avis.objects.filter(plat=instance).order_by('-created_at')[:3]
        return AvisMinimalSerializer(derniers_avis, many=True).data
