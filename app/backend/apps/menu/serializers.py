from rest_framework import serializers
from .models import Categorie, Plat


class CategorieSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(
        max_length=None,
        use_url=True,
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Categorie
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
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlatSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(
        max_length=None,
        use_url=True,
        allow_null=True,
        required=False,
    )
    categorie = serializers.PrimaryKeyRelatedField(queryset=Categorie.objects.all())
    prix = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    temps_preparation = serializers.IntegerField(min_value=1)

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
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
