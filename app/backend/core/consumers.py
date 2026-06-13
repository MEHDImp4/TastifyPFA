import asyncio
import contextlib

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.users.models import Utilisateur
from core.realtime import STAFF_GROUP

HEARTBEAT_INTERVAL_SECONDS = 25

STAFF_ROLES = {
    Utilisateur.Role.GERANT,
    Utilisateur.Role.SERVEUR,
    Utilisateur.Role.CUISINIER,
}


class StaffConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        if user.role not in STAFF_ROLES:
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(STAFF_GROUP, self.channel_name)
        await self.accept()
        self.heartbeat_task = asyncio.create_task(self._send_heartbeat())

    async def disconnect(self, close_code):
        heartbeat_task = getattr(self, "heartbeat_task", None)
        if heartbeat_task is not None:
            heartbeat_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await heartbeat_task

        if getattr(self, "channel_layer", None) is not None:
            await self.channel_layer.group_discard(STAFF_GROUP, self.channel_name)

    async def staff_event(self, event):
        await self.send_json(
            {
                "type": event["event_type"],
                "payload": event.get("payload", {}),
            }
        )

    async def _send_heartbeat(self):
        while True:
            await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)
            await self.send_json({"type": "heartbeat", "payload": {}})
