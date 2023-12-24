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
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    is_admin = models.BooleanField(default=False)


class Invitation(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_invitations")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_invitations")
    project = models.ForeignKey(Project, on_delete=models.CASCADE)


class ChatMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
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



    