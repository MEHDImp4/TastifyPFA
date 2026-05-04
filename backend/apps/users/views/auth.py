from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.permissions import AllowAny, IsAuthenticated
from ..serializers import CustomTokenObtainPairSerializer

class CookieTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            refresh_token = response.data.get('refresh')
            # Configuration du cookie HttpOnly pour le token de rafraîchissement
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=refresh_token,
                expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                secure=not settings.DEBUG,
                httponly=True,
                samesite='Lax'
            )
            # Retrait du refresh token de la réponse JSON pour limiter l'exposition XSS
            del response.data['refresh']
        return response

class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Some parsers expose immutable request.data objects; build a mutable payload
        # instead of mutating request.data directly.
        request_data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])

        if not refresh_token and not request_data.get('refresh'):
            return Response(
                {"detail": "Refresh token not provided.", "code": "token_not_provided"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if refresh_token and not request_data.get('refresh'):
            request_data['refresh'] = refresh_token

        serializer = self.get_serializer(data=request_data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(str(exc)) from exc
        response = Response(serializer.validated_data, status=status.HTTP_200_OK)

        if response.status_code == 200:
            active_refresh_token = response.data.get('refresh') or request_data.get('refresh')
            if active_refresh_token:
                try:
                    refresh = RefreshToken(active_refresh_token)
                except TokenError:
                    refresh = None

                if refresh is not None:
                    response.data['role'] = refresh.get('role')
                    response.data['username'] = refresh.get('username')

            if 'refresh' in response.data:
                new_refresh_token = response.data.get('refresh')
                # Mise à jour du cookie sécurisé suite à la rotation du token
                response.set_cookie(
                    key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                    value=new_refresh_token,
                    expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                    secure=not settings.DEBUG,
                    httponly=True,
                    samesite='Lax'
                )
                del response.data['refresh']
            
        return response

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        response = Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        return response
