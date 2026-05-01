from asgiref.sync import async_to_sync, sync_to_async
from channels.testing import WebsocketCommunicator
import pytest
from rest_framework_simplejwt.tokens import AccessToken

from apps.users.models import Utilisateur
from core.realtime import broadcast_staff_event
from tastify_backend.asgi import application


def build_socket_path(token: str):
    return f"/ws/staff/?token={token}"


@pytest.mark.django_db(transaction=True)
def test_staff_route_accepts_staff_token():
    user = Utilisateur.objects.create_user(
        username="gerant_route",
        password="password123",
        role=Utilisateur.Role.GERANT,
    )
    token = str(AccessToken.for_user(user))

    async def scenario():
        communicator = WebsocketCommunicator(
            application,
            build_socket_path(token),
            headers=[(b"origin", b"http://localhost")],
        )
        connected, _ = await communicator.connect()
        assert connected is True
        await communicator.disconnect()

    async_to_sync(scenario)()


@pytest.mark.django_db(transaction=True)
def test_group_send_reaches_staff_socket():
    user = Utilisateur.objects.create_user(
        username="serveur_broadcast",
        password="password123",
        role=Utilisateur.Role.SERVEUR,
    )
    token = str(AccessToken.for_user(user))

    async def scenario():
        communicator = WebsocketCommunicator(
            application,
            build_socket_path(token),
            headers=[(b"origin", b"http://localhost")],
        )
        connected, _ = await communicator.connect()
        assert connected is True

        await sync_to_async(broadcast_staff_event, thread_sensitive=False)(
            "infrastructure_test",
            {"source": "phase_13"},
        )

        message = await communicator.receive_json_from()
        assert message == {
            "type": "infrastructure_test",
            "payload": {"source": "phase_13"},
        }

        await communicator.disconnect()

    async_to_sync(scenario)()
