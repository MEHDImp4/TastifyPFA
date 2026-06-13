from rest_framework import serializers
from core.image_utils import convert_upload_to_webp
from .models import RestaurantConfiguration

class RestaurantConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantConfiguration
        fields = '__all__'

    def create(self, validated_data):
        logo = validated_data.get('logo')
        if logo:
            validated_data['logo'] = convert_upload_to_webp(logo)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        logo = validated_data.get('logo')
        if logo:
            validated_data['logo'] = convert_upload_to_webp(logo)
        return super().update(instance, validated_data)
