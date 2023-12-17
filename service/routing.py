from django.urls import re_path

from . import consumers

# regular expression matches only numeric room names
websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<room_name>\d+)/$", consumers.ChatConsumer.as_asgi()),
]