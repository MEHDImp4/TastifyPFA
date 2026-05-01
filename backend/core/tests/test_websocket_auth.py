from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
import pytest
import subprocess
import sys
from rest_framework_simplejwt.tokens import AccessToken

from apps.users.models import Utilisateur
from tastify_backend.asgi import application


def build_socket_path(token: str | None = None):
    if token is None:
        return "/ws/staff/"
    return f"/ws/staff/?token={token}"


async def connect_with_token(token: str | None):
    communicator = WebsocketCommunicator(
        application,
        build_socket_path(token),
        headers=[(b"origin", b"http://localhost")],
    )
    connected, detail = await communicator.connect()
    return communicator, connected, detail


@pytest.mark.django_db(transaction=True)
def test_missing_token_connection_is_rejected():
    async def scenario():
        communicator, connected, close_code = await connect_with_token(None)
        assert connected is False
        assert close_code == 4401
        await communicator.disconnect()

    async_to_sync(scenario)()


@pytest.mark.django_db(transaction=True)
def test_invalid_token_connection_is_rejected():
    async def scenario():
        communicator, connected, close_code = await connect_with_token("invalid-token")
        assert connected is False
        assert close_code == 4401
        await communicator.disconnect()

    async_to_sync(scenario)()


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize(
    "role",
    [
        Utilisateur.Role.GERANT,
        Utilisateur.Role.SERVEUR,
        Utilisateur.Role.CUISINIER,
    ],
)
def test_staff_roles_can_connect(role):
    user = Utilisateur.objects.create_user(
        username=f"{role.lower()}_ws",
        password="password123",
        role=role,
    )
    token = str(AccessToken.for_user(user))

    async def scenario():
        communicator, connected, _ = await connect_with_token(token)
        assert connected is True
        await communicator.disconnect()

    async_to_sync(scenario)()


@pytest.mark.django_db(transaction=True)
def test_client_role_is_rejected_with_forbidden_code():
    user = Utilisateur.objects.create_user(
        username="client_ws",
        password="password123",
        role=Utilisateur.Role.CLIENT,
    )
    token = str(AccessToken.for_user(user))

    async def scenario():
        communicator, connected, close_code = await connect_with_token(token)
        assert connected is False
        assert close_code == 4403
        await communicator.disconnect()

    async_to_sync(scenario)()


def test_asgi_module_imports_in_fresh_process():
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "import tastify_backend.asgi as asgi; print(type(asgi.application).__name__)",
        ],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert "ProtocolTypeRouter" in result.stdout
