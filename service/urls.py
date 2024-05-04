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
    path("get_project_info/<int:project_id>", views.get_project_info, name="get_project_info"),
    path("change_admin_condition", views.change_admin_condition, name="change_admin_condition"),
    path("remove_from_project", views.remove_from_project, name="remove_from_project"),
    path("close_project", views.close_project, name="close_project"),
    path("send_invitation/<int:projectId>", views.send_invitation, name="send_invitation"),
    path("invitation_accepted/<int:invitation_id>", views.invitation_accepted, name="invitation_accepted"),
    path("invitation_denied/<int:invitation_id>", views.invitation_denied, name="invitation_denied"),
    path("get_more_messages/<int:start>/<int:end>/<int:project_id>",views.get_more_messages, name="get_more_messages"),
    path("get_more_notes/<int:start>/<int:end>/<int:project_id>", views.get_more_notes, name="get_more_notes"),
    path("upload_file", views.upload_file, name="upload_file"),
    path("get_project_files/<int:projectId>", views.get_project_files, name="get_project_files"),
    path("download_file/<int:project_id>/<int:file_id>", views.download_file, name="download_file"),
    path("get_whiteboard_elements/<int:project_id>/<int:whiteboard_id>", views.get_whiteboard_elements, name="get_whiteboard_elements"),
    path("delete_file", views.delete_file, name="delete_file"),
    path("get_whiteboards/<int:project_id>", views.get_whiteboards, name="get_whiteboards"),
    path("create_whiteboard", views.create_whiteboard, name="create_whiteboard"),
    path("delete_whiteboard", views.delete_whiteboard, name="delete_whiteboard"),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)