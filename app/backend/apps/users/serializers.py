from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.users.reset_tokens import is_valid_password_reset_token, resolve_password_reset_user

User = get_user_model()

# Un Serializer est un "Traducteur"
# Il transforme les objets Python (de la base de données) en JSON (pour le frontend)
# Et inversement : il valide le JSON reçu pour le transformer en objet Python.

class UserRegisterSerializer(serializers.ModelSerializer):
    # On précise que le mot de passe ne doit être utilisé que pour l'écriture (pas renvoyé au client)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        # Champs que l'on accepte lors de l'inscription
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        # Cette méthode est appelée quand on fait serializer.save()
        # On utilise create_user pour que Django hash (chiffre) le mot de passe automatiquement
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=User.Role.CLIENT # Par sécurité, on force le rôle CLIENT lors de l'inscription publique
        )
        return user


# Personnalisation du badge de sécurité (Token JWT)
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        # On ajoute des informations personnalisées à l'intérieur du token (le "payload")
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        return token

    def validate(self, attrs):
        # Cette méthode est appelée lors de la tentative de connexion (Login)
        # On normalise le nom d'utilisateur (ignorer la casse : Admin == admin)
        submitted_username = attrs.get('username')
        if isinstance(submitted_username, str):
            normalized_username = submitted_username.strip()
            matched_user = User.objects.filter(username__iexact=normalized_username).only('username').first()
            attrs['username'] = matched_user.username if matched_user else normalized_username

        # On appelle la validation de base de Django REST Framework
        data = super().validate(attrs)
        
        # On ajoute le rôle et le nom d'utilisateur dans la réponse JSON finale
        # pour que le frontend sache quel menu afficher immédiatement
        data['role'] = self.user.role
        data['username'] = self.user.username
        return data


class AuthMessageSerializer(serializers.Serializer):
    message = serializers.CharField()


class RegisterResponseSerializer(AuthMessageSerializer):
    username = serializers.CharField()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetTokenSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()

    def validate(self, attrs):
        user = resolve_password_reset_user(attrs['uid'])
        if not is_valid_password_reset_token(user=user, token=attrs['token']):
            raise serializers.ValidationError({'token': 'RESET_TOKEN_INVALID'})
        attrs['user'] = user
        return attrs


class PasswordResetConfirmSerializer(PasswordResetTokenSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'PASSWORD_CONFIRM_MISMATCH'})

        try:
            validate_password(attrs['password'], user=attrs['user'])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': exc.messages or ['PASSWORD_TOO_WEAK']}) from exc
        return attrs
