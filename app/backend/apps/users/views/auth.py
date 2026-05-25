import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from core.notifications import send_password_reset_requested_email
from ..serializers import (
    AuthMessageSerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PasswordResetTokenSerializer,
    RegisterResponseSerializer,
    UserRegisterSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


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
            set_refresh_cookie(response, request, refresh_token)
            del response.data['refresh']
        return response


class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
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
                set_refresh_cookie(response, request, new_refresh_token)
                del response.data['refresh']
            
        return response

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AuthMessageSerializer

    @extend_schema(responses={200: AuthMessageSerializer})
    def post(self, request):
        response = Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        clear_refresh_cookie(response, request)
        return response


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer

    @extend_schema(request=PasswordResetRequestSerializer, responses={200: AuthMessageSerializer})
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user is not None and user.has_usable_password():
            send_password_reset_requested_email(user=user)
            logger.info("Password reset requested for user_id=%s", user.pk)
        else:
            logger.info("Password reset requested for unknown_or_inactive_email")

        return Response({"message": "RESET_REQUEST_ACCEPTED"}, status=status.HTTP_200_OK)


class PasswordResetValidateView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetTokenSerializer

    @extend_schema(request=PasswordResetTokenSerializer, responses={200: AuthMessageSerializer, 400: PasswordResetTokenSerializer})
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"message": "RESET_TOKEN_VALID"}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    @extend_schema(request=PasswordResetConfirmSerializer, responses={200: AuthMessageSerializer, 400: PasswordResetConfirmSerializer})
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['password'])
        user.save(update_fields=['password'])
        logger.info("Password reset completed for user_id=%s", user.pk)
        return Response({"message": "RESET_PASSWORD_UPDATED"}, status=status.HTTP_200_OK)
