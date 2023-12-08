from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User,Project,ProjectMembership

# Register your models here.

admin.site.register(User)
admin.site.register(Project)
admin.site.register(ProjectMembership)

