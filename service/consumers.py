import json
from channels.generic.websocket import WebsocketConsumer, AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from .models import ChatMessage, Project, Item, Comment, Note, ExcalidrawInstance
from django.utils import timezone

# SECURITY , ESPECIALLY CSRF TD
# PROBABLY BETTER TO MAKE EVERYTHING ASYNC TO SCALE

# SHOULD CHECK IF DIFFERENT CHATS DON'T FETCH OTHERS, BUT SHOULD BE OK PER IMPLEMENTATION OF get_chat_history
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name 
        )

        await self.accept()

        chat_history = await self.get_chat_history()

        await self.send(text_data=json.dumps({"type":"chat_history","chat_history":chat_history}))

    async def disconnect(self,close_code):
        #Leave group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )
    
    # Receive message from Websocket
    async def receive(self,text_data):
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
        
        await self.save_message(chat_message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name, {"type":"chat.message","message":message,"sender":sender.username, "timestamp":timestamp.strftime("%b %d %Y, %I:%M %p")}
        )

   # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        sender =  event.get('sender','')
        timestamp = event.get('timestamp')

        # Send message to WebSocket 
        await self.send(text_data=json.dumps({"type":"message", "message": message, "sender":sender, "timestamp":timestamp}))

    @database_sync_to_async
    def save_message(self,chat_message):
        chat_message.save()
        return

    @database_sync_to_async
    def get_chat_history(self):
        chat_messages = ChatMessage.objects.filter(room_id=self.room_name).order_by("-timestamp")[:10]
        chat_history = [message.serialize() for message in chat_messages]
        return chat_history


class NotesConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"notes_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )

        await self.accept()

        
        # Can't directly serialize query
        notes = await self.get_notes()

        await self.send(text_data=json.dumps({"type":"notes","notes":notes})) 
    
    async def disconnect(self,close_code):
        #Leave group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    
        # Receive message from websocket
    async def receive(self,text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        if message_type == 'new_note':
            content = text_data_json.get('content')
            project = await self.get_project(self.room_name)

            new_note = Note(
                created_by = self.scope["user"],
                content = content,
                project = project
            )
            await self.save_note(new_note)
            
            # Send message to group
            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type":"note.new",
                    "new_note":new_note.serialize()
                }
            )
        elif message_type == 'delete_note':
            note_id = text_data_json.get('note_id')
            await self.delete_note(note_id)

            # Send message to group
            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type":"note.delete",
                    "note_id":note_id
                }
            )

    async def note_new(self,event):
        new_note = event["new_note"]

        await self.send(text_data=json.dumps({"type":"new_note","new_note":new_note}))

    async def note_delete(self,event):
        note_id = event["note_id"]
        
        await self.send(text_data=json.dumps({"type":"delete_note","note_id":note_id}))


    @database_sync_to_async
    def get_notes(self):
        notes_query = Note.objects.filter(project=Project.objects.get(pk=self.room_name))
        notes = [note.serialize() for note in notes_query]
        return notes
    
    @database_sync_to_async
    def save_note(self,new_note):
        new_note.save()
        return

    @database_sync_to_async
    def delete_note(self,note_id):
        note_to_delete = Note.objects.get(pk=note_id)
        note_to_delete.delete()
        return

    @database_sync_to_async
    def get_project(self,id):
        project = Project.objects.get(pk=id)
        return project

class ExcalidrawConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name  = f"excalidraw_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name 
        )
        await self.accept()
        

    async def disconnect(self,close_code):
        #Leave group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )
    # Receive from websocket
    async def receive(self,text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message')
        if message == 'sending_elements':
            user_id = text_data_json.get('user_id')
            excalidraw_elements = text_data_json.get('excalidraw_elements') 
            
            await self.update_whiteboard(self.room_name,excalidraw_elements)

            # Send message to group
            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type":"update.elements",
                    "excalidraw_elements":excalidraw_elements,
                    "user_id":user_id
                }
            )
        elif message == 'sending_files':
            user_id = text_data_json.get('user_id')
            excalidraw_files = text_data_json.get('excalidraw_files')

            

            # Send message to group

            await self.channel_layer.group_send(
                self.room_group_name, {
                    "type":"update.files",
                    "excalidraw_files":excalidraw_files,
                    "user_id":user_id
                }
            )

 
    async def update_elements(self,event):
        excalidraw_elements = event["excalidraw_elements"]
        user_id = event["user_id"]
        await self.send(text_data=json.dumps({"type":"update_elements","excalidraw_elements":excalidraw_elements,"user_id":user_id}))

    async def update_files(self,event):
        excalidraw_files = event["excalidraw_files"]
        user_id = event["user_id"]
        await self.send(text_data=json.dumps({"type":"update_files","excalidraw_files":excalidraw_files,"user_id":user_id}))

    
    @database_sync_to_async
    def update_whiteboard(self,whiteboard_id,excalidraw_elements):
        current_whiteboard = ExcalidrawInstance.objects.get(pk=whiteboard_id)
        current_whiteboard.elements = excalidraw_elements
        current_whiteboard.save()
        return



class ItemConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"items_{self.room_name}"

        # join room group
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )

        await self.accept()

        items = await self.load_items(self.room_name)
        
        await self.send(text_data=json.dumps({"type":"items", "items":items}))

    async def disconnect(self,close_code):
        #Leave group
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    # Receive message from websocket
    async def receive(self,text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type','')
        action = text_data_json.get('action')

        if message_type == "item":
            if action == "create":
                item = Item(
                    created_by=self.scope["user"],
                    project=await self.get_project(self.room_name),
                    title=text_data_json.get('title'),
                    description=text_data_json.get('description'),
                )
                await self.save_item(item)
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name, {"type":"message.item",
                    "item_id":item.id,
                    "created_by":self.scope["user"].username,
                    "title":text_data_json.get('title'),
                    "description":text_data_json.get('description'),
                    "timestamp":timezone.now().strftime("%b %d %Y, %I:%M %p")}
                )
            elif action == "delete":
                item_id = text_data_json.get('item_id')
                await self.delete_item(item_id)
                
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name, {
                        "type":"item.delete",
                        "item_id":item_id
                    }
                )

        elif message_type == "comment":
            if action == "create":
                comment = Comment(
                    created_by=self.scope["user"],
                    item=await self.get_item(text_data_json.get('item_id')),
                    text=text_data_json.get('text'),
                )
                await self.save_comment(comment)
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name, {"type":"message.comment",
                    "id":comment.pk,
                    "item_id": comment.item.id,
                    "created_by":self.scope["user"].username,
                    "text":text_data_json.get('text'),
                    "timestamp":timezone.now().strftime("%b %d %Y, %I:%M %p")}
                )
            elif action =="delete":
                item_id = text_data_json.get('item_id')
                comment_id = text_data_json.get('comment_id')
                await self.delete_comment(comment_id)
                
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name, {
                        "type":"comment.delete",
                        "item_id":item_id,
                        "comment_id":comment_id
                    }
                )

    # Receive two types of messages from room group in separated functions    
    async def message_item(self,event):
        item = {
            "item_id": event.get('item_id'),
            "created_by": event.get('created_by'),
            "title": event.get('title'),
            "description":event.get('description'),
            "timestamp":event.get('timestamp'),
        }
        # Send message to WebSocket
        await self.send(text_data=json.dumps({"type":"item","action":"create","item":item}))
    
    async def message_comment(self,event):
        item_id = event.get('item_id')
        comment = {
            "id":event.get('id'),
            "created_by":event.get('created_by'),
            "text":event.get('text'),
            "timestamp":event.get('timestamp'),
        }
        # Send message to WebSocket
        await self.send(text_data=json.dumps({"type":"comment","action":"create","item_id":item_id, "comment":comment}))

    async def item_delete(self,event):
        item_id = event.get('item_id')
        await self.send(text_data=json.dumps({"type":"item","action":"delete","item_id":item_id}))

    async def comment_delete(self,event):
        item_id = event.get('item_id')
        comment_id = event.get('comment_id')
        await self.send(text_data=json.dumps({"type":"comment","action":"delete","item_id":item_id,"comment_id":comment_id}))

    @database_sync_to_async
    def get_project(self,project_id):
        project=Project.objects.get(pk=project_id)
        return project

    @database_sync_to_async
    def get_item(self,item_id):
        item = Item.objects.get(pk=item_id)
        return item

    @database_sync_to_async
    def save_item(self,item):
        item.save()
        return

    @database_sync_to_async
    def delete_item(self,item_id):
        item_to_delete = Item.objects.get(pk=item_id)
        item_to_delete.delete()
        return

    @database_sync_to_async
    def save_comment(self,comment):
        comment.save()
        return

    @database_sync_to_async
    def delete_comment(self,comment_id):
        comment_to_delete = Comment.objects.get(pk=comment_id)
        comment_to_delete.delete()
        return

    @database_sync_to_async
    def load_items(self,project_id):
        items_list = []
        item_objects = Item.objects.filter(project=(Project.objects.get(pk=project_id)))
            
        for item in item_objects:
            comments = Comment.objects.filter(item=item)

            items_list.append({
                "item_id":item.id,
                "created_by":item.created_by.username,
                "title": item.title,
                "description": item.description,
                "timestamp": item.created_at.strftime("%b %d %Y, %I:%M %p"), 
                "comments": [comment.serialize() for comment in comments],
            })

        return items_list
    