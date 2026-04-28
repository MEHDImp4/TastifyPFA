from rest_framework import serializers
from .models import Categorie


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
