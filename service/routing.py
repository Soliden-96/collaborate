from django.urls import re_path

from . import consumers

# regular expression matches only numeric room names
websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<room_name>\d+)/$", consumers.ChatConsumer.as_asgi()),
    re_path(r"ws/items/(?P<room_name>\d+)/$", consumers.ItemConsumer.as_asgi()),
    re_path(r"ws/notes/(?P<room_name>\d+)/$", consumers.NotesConsumer.as_asgi()),
    re_path(r"ws/draw/(?P<room_name>\d+)/$", consumers.ExcalidrawConsumer.as_asgi()),
]