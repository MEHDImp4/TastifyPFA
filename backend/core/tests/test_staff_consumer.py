from decimal import Decimal

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


@pytest.mark.django_db(transaction=True)
def test_broadcast_staff_event_normalizes_decimal_payloads():
    user = Utilisateur.objects.create_user(
        username="cuisinier_decimal_broadcast",
        password="password123",
        role=Utilisateur.Role.CUISINIER,
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
            "order_created",
            {
                "order": {
                    "id": 42,
                    "montant_total": Decimal("95.50"),
                    "lignes": [
                        {
                            "plat_details": {
                                "id": 7,
                                "nom": "Tajine",
                                "prix": Decimal("45.25"),
                            }
                        }
                    ],
                }
            },
        )

        message = await communicator.receive_json_from()
        assert message == {
            "type": "order_created",
            "payload": {
                "order": {
                    "id": 42,
                    "montant_total": 95.5,
                    "lignes": [
                        {
                            "plat_details": {
                                "id": 7,
                                "nom": "Tajine",
                                "prix": 45.25,
                            }
                        }
                    ],
                }
            },
        }

        await communicator.disconnect()

    async_to_sync(scenario)()
