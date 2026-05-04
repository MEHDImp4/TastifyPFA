from django.urls import path
from .views.auth import CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView

app_name = 'users'

urlpatterns = [
    path('login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
