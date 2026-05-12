from rest_framework import serializers
from .models import RestaurantConfiguration

class RestaurantConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantConfiguration
        fields = '__all__'
