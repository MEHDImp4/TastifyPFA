from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.permissions import AllowAny, IsAuthenticated
from ..serializers import (
    AuthMessageSerializer,
    CustomTokenObtainPairSerializer,
    RegisterResponseSerializer,
    UserRegisterSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegisterSerializer

    @extend_schema(
        request=UserRegisterSerializer,
        responses={201: RegisterResponseSerializer, 400: UserRegisterSerializer},
    )
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "Compte cree avec succes",
                "username": user.username
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


AUTH_PORTAL_COOKIE_NAMES = {
    'staff': f"{settings.SIMPLE_JWT['AUTH_COOKIE']}_staff",
    'client': f"{settings.SIMPLE_JWT['AUTH_COOKIE']}_client",
}


def get_auth_portal(request):
    portal = request.headers.get('X-Tastify-Portal', 'staff').lower()
    return portal if portal in AUTH_PORTAL_COOKIE_NAMES else 'staff'


def get_auth_cookie_name(request):
    return AUTH_PORTAL_COOKIE_NAMES[get_auth_portal(request)]


def set_refresh_cookie(response, request, refresh_token):
    response.set_cookie(
        key=get_auth_cookie_name(request),
        value=refresh_token,
        expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
        secure=not settings.DEBUG,
        httponly=True,
        samesite='Lax'
    )


def clear_refresh_cookie(response, request):
    response.delete_cookie(get_auth_cookie_name(request))

class CookieTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            refresh_token = response.data.get('refresh')
            # Configuration du cookie HttpOnly pour le token de rafraîchissement
            set_refresh_cookie(response, request, refresh_token)
            # Retrait du refresh token de la réponse JSON pour limiter l'exposition XSS
            del response.data['refresh']
        return response

import logging

logger = logging.getLogger(__name__)

class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Some parsers expose immutable request.data objects; build a mutable payload
        # instead of mutating request.data directly.
        request_data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        cookie_name = get_auth_cookie_name(request)
        refresh_token = request.COOKIES.get(cookie_name)
        
        portal = get_auth_portal(request)
        logger.debug(f"Refresh attempt for portal: {portal}, cookie_name: {cookie_name}")

        if not refresh_token and not request_data.get('refresh'):
            logger.warning(f"Refresh failed: No token found in cookie '{cookie_name}' or request data")
            return Response(
                {"detail": "Refresh token not provided.", "code": "token_not_provided"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if refresh_token and not request_data.get('refresh'):
            logger.debug(f"Using refresh token from cookie '{cookie_name}'")
            request_data['refresh'] = refresh_token

        serializer = self.get_serializer(data=request_data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            logger.warning(f"Refresh failed: TokenError - {str(exc)}")
            raise InvalidToken(str(exc)) from exc
        except Exception as e:
            logger.error(f"Refresh failed: Unexpected error - {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)

        if response.status_code == 200:
            logger.info(f"Refresh successful for portal: {portal}")
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
                set_refresh_cookie(response, request, new_refresh_token)
                del response.data['refresh']
            
        return response

class LogoutView(APIView):
    permission_classes = [AllowAny]
    serializer_class = AuthMessageSerializer

    @extend_schema(responses={200: AuthMessageSerializer})
    def post(self, request):
        response = Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        clear_refresh_cookie(response, request)
        return response
