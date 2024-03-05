from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *

# Register your models here.

admin.site.register(User)
admin.site.register(Project)
admin.site.register(Invitation)
admin.site.register(ProjectMembership)
admin.site.register(ChatMessage)
admin.site.register(Item)
admin.site.register(Comment)
admin.site.register(File)
admin.site.register(Note)
admin.site.register(ExcalidrawInstance)
admin.site.register(ExcalidrawFile)


