import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from .models import ChatMessage, Project, Item, Comment, Note, ExcalidrawInstance
from django.utils import timezone

# SECURITY , ESPECIALLY CSRF TD
# PROBABLY BETTER TO MAKE EVERYTHING ASYNC TO SCALE

# SHOULD CHECK IF DIFFERENT CHATS DON'T FETCH OTHERS, BUT SHOULD BE OK PER IMPLEMENTATION OF get_chat_history
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
        # Use testuser in case of testing
        sender = self.scope["user"]

        chat_message = ChatMessage(
            sender=sender, 
            room_id=self.room_name, 
            message=message, 
            timestamp=timestamp
            )
        chat_message.save()

        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name, {"type":"chat.message","message":message,"sender":sender.username, "timestamp":timestamp.strftime("%b %d %Y, %I:%M %p")}
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


class NotesConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"notes_{self.room_name}"

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )

        self.accept()

        
        # Can't directly serialize query
        notes = self.get_notes()

        self.send(text_data=json.dumps({"type":"notes","notes":notes})) 
    
    def disconnect(self,close_code):
        #Leave group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )

    
        # Receive message from websocket
    def receive(self,text_data):
        text_data_json = json.loads(text_data)
        content = text_data_json.get('content')
        project = Project.objects.get(pk=self.room_name)

        new_note = Note(
            created_by = self.scope["user"],
            content = content,
            project = project
        )
        new_note.save()
        
        # Send message to group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name, {
                "type":"note.new",
                "new_note":new_note.serialize()
            }
        )

    def note_new(self,event):
        new_note = event["new_note"]

        self.send(text_data=json.dumps({"type":"new_note","new_note":new_note}))

    def get_notes(self):
        notes = Note.objects.filter(project=Project.objects.get(pk=self.room_name))
        return [note.serialize() for note in notes]


class ExcalidrawConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name  = f"excalidraw_{self.room_name}"

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )
        self.accept()
        
        current_project = Project.objects.get(pk=self.room_name)
        try:
            whiteboard = ExcalidrawInstance.objects.get(project=current_project)
            
            self.send(text_data=json.dumps({"type":"init","excalidraw_elements":whiteboard.elements}))
        except ExcalidrawInstance.DoesNotExist:
            self.send(text_data=json.dumps({"type":"new_whiteboard"}))

        

    def disconnect(self,close_code):
        #Leave group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )
    # Receive from websocket
    def receive(self,text_data):
        text_data_json = json.loads(text_data)
        excalidraw_elements = text_data_json.get('excalidrawElements')
        user_id = text_data_json.get('user_id')
            
        # update the database instance if it exist, else create a new one
        current_project = Project.objects.get(pk=self.room_name)
        
        current_whiteboard = ExcalidrawInstance.objects.get(project=current_project)
        current_whiteboard.elements = excalidraw_elements
        current_whiteboard.save()
        
            
        # Send message to group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name, {
                "type":"update.new",
                "excalidraw_elements":excalidraw_elements,
                "user_id":user_id
            }
        )

    def update_new(self,event):
        excalidraw_elements = event["excalidraw_elements"]
        user_id = event["user_id"]
        self.send(text_data=json.dumps({"type":"update","excalidraw_elements":excalidraw_elements,"user_id":user_id}))





class ItemConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"items_{self.room_name}"

        # join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )

        self.accept()

        items = []
        item_objects = Item.objects.filter(project=(Project.objects.get(pk=self.room_name)))
        
        for item in item_objects:
            comments = Comment.objects.filter(item=item)

            items.append({
                "item_id":item.id,
                "created_by":item.created_by.username,
                "title": item.title,
                "description": item.description,
                "timestamp": item.created_at.strftime("%b %d %Y, %I:%M %p"), 
                "comments": [comment.serialize() for comment in comments],
            })
        
        self.send(text_data=json.dumps({"type":"items", "items":items}))

    def disconnect(self,close_code):
        #Leave group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )

    # Receive message from websocket
    def receive(self,text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type','')

        if message_type == "item":
            item = Item(
                created_by=self.scope["user"],
                project=Project.objects.get(pk=self.room_name),
                title=text_data_json.get('title'),
                description=text_data_json.get('description'),
            )
            item.save()
            # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type":"message.item",
                "item_id":item.id,
                "created_by":self.scope["user"].username,
                "title":text_data_json.get('title'),
                "description":text_data_json.get('description'),
                "timestamp":timezone.now().strftime("%b %d %Y, %I:%M %p")}
            )
        elif message_type == "comment":
            comment = Comment(
                created_by=self.scope["user"],
                item=Item.objects.get(pk=text_data_json.get('item_id')),
                text=text_data_json.get('text'),
            )
            comment.save()
            # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type":"message.comment",
                "id":comment.pk,
                "item_id": comment.item.id,
                "created_by":self.scope["user"].username,
                "text":text_data_json.get('text'),
                "timestamp":timezone.now().strftime("%b %d %Y, %I:%M %p")}
            )

    # Receive two types of messages from room group in separated functions    
    def message_item(self,event):
        item = {
            "item_id": event.get('item_id'),
            "created_by": event.get('created_by'),
            "title": event.get('title'),
            "description":event.get('description'),
            "timestamp":event.get('timestamp'),
        }
        # Send message to WebSocket
        self.send(text_data=json.dumps({"type":"item","item":item}))
    
    def message_comment(self,event):
        item_id = event.get('item_id')
        comment = {
            "id":event.get('id'),
            "created_by":event.get('created_by'),
            "text":event.get('text'),
            "timestamp":event.get('timestamp'),
        }
        # Send message to WebSocket
        self.send(text_data=json.dumps({"type":"comment","item_id":item_id, "comment":comment}))



    