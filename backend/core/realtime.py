from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

STAFF_GROUP = "staff_group"
STAFF_EVENT_TYPE = "staff.event"


def broadcast_staff_event(event_type: str, payload: dict):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        STAFF_GROUP,
        {
            "type": STAFF_EVENT_TYPE,
            "event_type": event_type,
            "payload": payload,
        },
    )
