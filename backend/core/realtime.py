import json

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.renderers import JSONRenderer

STAFF_GROUP = "staff_group"
STAFF_EVENT_TYPE = "staff.event"


def make_json_safe(payload: dict) -> dict:
    return json.loads(JSONRenderer().render(payload))


def broadcast_staff_event(event_type: str, payload: dict):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    async_to_sync(channel_layer.group_send)(
        STAFF_GROUP,
        {
            "type": STAFF_EVENT_TYPE,
            "event_type": event_type,
            "payload": make_json_safe(payload),
        },
    )
