from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout",views.logout_view, name="logout"),
    path("register", views.register_view, name="register"),
    path("profile",views.profile, name="profile"),
    path("create_project", views.create_project, name="create_project"),
    path("project/<int:id>", views.project, name="project")
]