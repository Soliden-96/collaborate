import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

from .models import ChatMessage
from django.utils import timezone

# Security Todo

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name 
        )

        self.accept()

        chat_history = self.get_chat_history()

        self.send(text_data=json.dumps({"type":"chat_history","chat_history":chat_history}))

    def disconnect(self,close_code):
        #Leave group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )
    
    # Receive message from Websocket
    def receive(self,text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message')
        timestamp = timezone.now()

        chat_message = ChatMessage(
            sender=self.scope["user"], 
            room_id=self.room_name, 
            message=message, 
            timestamp=timestamp
            )
        chat_message.save()

        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name, {"type":"chat.message","message":message,"sender":self.scope["user"].username, "timestamp":timestamp.strftime("%b %d %Y, %I:%M %p")}
        )

   # Receive message from room group
    def chat_message(self, event):
        message = event["message"]
        sender =  event.get('sender','')
        timestamp = event.get('timestamp')

        # Send message to WebSocket 
        self.send(text_data=json.dumps({"type":"message", "message": message, "sender":sender, "timestamp":timestamp}))

    def get_chat_history(self):
        chat_messages = ChatMessage.objects.filter(room_id=self.room_name).order_by("-timestamp")[:10]

        return [message.serialize() for message in chat_messages]




    