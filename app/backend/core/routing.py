from django.urls import path

from core.consumers import StaffConsumer

websocket_urlpatterns = [
    path("ws/staff/", StaffConsumer.as_asgi()),
]
