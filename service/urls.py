from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout",views.logout_view, name="logout"),
    path("register", views.register_view, name="register"),
    path("create_project", views.create_project, name="create_project"),
    path("project/<int:id>", views.project, name="project"),
    path("send_invitation/<int:projectId>", views.send_invitation, name="send_invitation"),
    path("invitation_accepted/<int:invitation_id>", views.invitation_accepted, name="invitation_accepted"),
    path("invitation_denied/<int:invitation_id>", views.invitation_denied, name="invitation_denied"),
    path("get_thread/<int:item_id>", views.get_thread, name="get_thread"),
    path("upload_file", views.upload_file, name="upload_file"),
    path("get_project_files/<int:projectId>", views.get_project_files, name="get_project_files"),
    path("download_file/<int:project_id>/<int:file_id>", views.download_file, name="download_file"),
    path("get_whiteboard_elements/<int:project_id>", views.get_whiteboard_elements, name="get_whiteboard_elements"),
    path("delete_file", views.delete_file, name="delete_file"),
] 