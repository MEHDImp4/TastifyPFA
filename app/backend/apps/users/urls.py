# Configuration des routes pour le module Utilisateurs
# Chaque chemin (path) est lié à une Vue (View) spécifique

from django.urls import path
from .views.auth import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    LogoutView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PasswordResetValidateView,
    RegisterView,
)

app_name = 'users'

urlpatterns = [
    # Authentification et gestion de session
    path('login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # Inscription
    path('register/', RegisterView.as_view(), name='register'),
    
    # Réinitialisation du mot de passe (en cas d'oubli)
    path('request-reset/', PasswordResetRequestView.as_view(), name='request_reset'),
    path('validate-reset-token/', PasswordResetValidateView.as_view(), name='validate_reset_token'),
    path('confirm-reset/', PasswordResetConfirmView.as_view(), name='confirm_reset'),
]
