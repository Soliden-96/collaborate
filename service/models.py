from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class User(AbstractUser):
    def __str__(self):
        return f"{self.username}"


class Project(models.Model):
    title = models.CharField(max_length=64)
    def __str__(self):
        return f"{self.title}"

class ProjectMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="project_memberships")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="memberships")
    is_admin = models.BooleanField(default=False) 


class Invitation(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_invitations")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_invitations")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="invitations")


class ChatMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    room_id = models.IntegerField()
    message = models.TextField(max_length=64)
    timestamp = models.DateTimeField()

    def serialize(self):
        return {
            'sender':self.sender.username,
            'room_id':self.room_id,
            'message':self.message,
            'timestamp':self.timestamp.strftime("%b %d %Y, %I:%M %p")
        }

    def __str__(self):
        return f"{self.message}"


class Item(models.Model):
    title = models.CharField(max_length=64)
    description = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_items")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="items")
    status = models.CharField(max_length=20, choices=[('open','Open'),('closed','Closed')])
    created_at = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "item_id":self.pk,
            "title":self.title,
            "description":self.description,
            "created_by":self.created_by.username,
            "created_at":self.created_at.strftime("%b %d %Y, %I:%M %p")
        }


class Comment(models.Model):
    text = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="comment")
    created_at = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.pk,
            "created_by": self.created_by.username,
            "text": self.text,
            "timestamp": self.created_at.strftime("%b %d %Y, %I:%M %p")
        }


class File(models.Model):
    name = models.CharField(max_length=64)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="uploaded_files")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="project_files")
    # NEED TO CHECK FILE STORAGE FOR DEPLOYMENT
    file = models.FileField(upload_to="filerepo")
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id":self.pk,
            "name":self.name,
            "uploaded_by":self.uploaded_by.username,
            "timestamp":self.timestamp.strftime("%b %d %Y, %I:%M %p")
        }


class Note(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="project_notes")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id":self.pk,
            "created_by":self.created_by.username,
            "content":self.content,
            "timestamp":self.timestamp.strftime("%b %d %Y, %I:%M %p")
        }

    
class ExcalidrawInstance(models.Model):
    elements = models.JSONField(null=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="excalidraw_instances")
    created_at = models.DateTimeField(auto_now_add=True)





    