from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.hashers import make_password
from apps.users.models import Utilisateur
from .models import Employe, Shift, OffreEmploi, Candidature

class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'is_active']
        read_only_fields = ['id']

class EmployeSerializer(serializers.ModelSerializer):
    user_details = UserMinimalSerializer(source='user', read_only=True)
    
    # Fields for user creation/update
    username = serializers.CharField(write_only=True, required=False, max_length=150)
    password = serializers.CharField(write_only=True, required=False, min_length=8, max_length=128)
    first_name = serializers.CharField(write_only=True, required=False, max_length=150)
    last_name = serializers.CharField(write_only=True, required=False, max_length=150)
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
            with transaction.atomic():
                user.save()
            user_updated = False
            
        return super().update(instance, validated_data)


class ShiftSerializer(serializers.ModelSerializer):
    employe_name = serializers.ReadOnlyField(source='employe.user.get_full_name')

    class Meta:
        model = Shift
        fields = '__all__'

    def validate(self, attrs):
        # Basic overlap validation
        heure_debut = attrs.get('heure_debut')
        heure_fin = attrs.get('heure_fin')
        jour = attrs.get('jour')
        employe = attrs.get('employe')

        if heure_debut and heure_fin and heure_debut >= heure_fin:
            raise serializers.ValidationError("L'heure de début doit être avant l'heure de fin.")

        # Check for overlaps (excluding self if update)
        qs = Shift.objects.filter(employe=employe, jour=jour)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        
        overlapping = qs.filter(
            heure_debut__lt=heure_fin,
            heure_fin__gt=heure_debut
        ).exists()

        if overlapping:
            raise serializers.ValidationError("Cet employé a déjà un shift qui chevauche ces horaires.")

        return attrs


class OffreEmploiSerializer(serializers.ModelSerializer):
    candidatures_count = serializers.IntegerField(source='candidatures.count', read_only=True)

    class Meta:
        model = OffreEmploi
        fields = '__all__'


class CandidatureSerializer(serializers.ModelSerializer):
    offre_titre = serializers.ReadOnlyField(source='offre.titre')

    class Meta:
        model = Candidature
        fields = '__all__'
        read_only_fields = ['created_at']

