from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Ajout d'informations personnalisées dans le payload du token (RBAC)
        token['username'] = user.username
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Injection du rôle et du nom d'utilisateur dans la réponse JSON initiale
        data['role'] = self.user.role
        data['username'] = self.user.username
        
        return data
