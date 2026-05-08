from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.hashers import make_password
from apps.users.models import Utilisateur
from .models import Employe

class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'is_active']
        read_only_fields = ['id']

class EmployeSerializer(serializers.ModelSerializer):
    user_details = UserMinimalSerializer(source='user', read_only=True)
    
    # Fields for user creation/update
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    role = serializers.ChoiceField(choices=Utilisateur.Role.choices, write_only=True, required=False)

    class Meta:
        model = Employe
        fields = [
            'id', 'user', 'user_details', 'poste', 'salaire', 'date_embauche', 
            'telephone', 'adresse', 'cin', 'created_at', 'updated_at',
            'username', 'password', 'first_name', 'last_name', 'email', 'role'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)

        if not username:
            raise serializers.ValidationError({'username': 'This field is required.'})
        if not password:
            raise serializers.ValidationError({'password': 'This field is required.'})

        user_data = {
            'username': username,
            'password': make_password(password),
            'first_name': validated_data.pop('first_name', ''),
            'last_name': validated_data.pop('last_name', ''),
            'email': validated_data.pop('email', ''),
            'role': validated_data.pop('role', Utilisateur.Role.SERVEUR),
        }
        
        with transaction.atomic():
            user = Utilisateur.objects.create(**user_data)
            employe = Employe.objects.create(user=user, **validated_data)
        return employe

    def update(self, instance, validated_data):
        # Update user fields if provided
        user = instance.user
        user_fields = ['username', 'first_name', 'last_name', 'email', 'role']
        user_updated = False
        
        for field in user_fields:
            if field in validated_data:
                setattr(user, field, validated_data.pop(field))
                user_updated = True
        
        if 'password' in validated_data:
            user.password = make_password(validated_data.pop('password'))
            user_updated = True
            
        if user_updated:
            user.save()
            
        return super().update(instance, validated_data)
