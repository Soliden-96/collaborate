from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponseRedirect, FileResponse
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse
from django.db import IntegrityError
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
import json


from .models import *

# Create your views here.
 
def index(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse("login"))

    invitations = Invitation.objects.filter(receiver=request.user)
    project_memberships = ProjectMembership.objects.filter(user=request.user)
    projects = [membership.project for membership in project_memberships]
    
    return render(request, "service/index.html", {"invitations": invitations, "projects": projects})

# Accessing to the website directly from the urlbar does not set the CSRF Cookie
@csrf_exempt
def login_view(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get('username','')
        password = data.get('password','')
        user = authenticate(request,username=username,password=password)

        if user is not None:
            login(request, user)
            return JsonResponse({"success":True,"message":"Successfully logged in"},status=200)
        else:
            return JsonResponse({"message":"Invalid credentials"},status=400)
    
    if request.user.is_authenticated:
        return HttpResponseRedirect(reverse("index"))

    return render(request,'service/access.html')


def register_view(request):
    if request.method =="POST":
        data = json.loads(request.body)
        username = data.get('username','')
        email = data.get('email','')
        password = data.get('password','')
        confirmation = data.get('confirmation','')

        if password != confirmation:
            return JsonResponse({"message":"Passwords don't match"},status=400)
        
        try:
            user = User.objects.create_user(username,email,password)
            user.save()
        except IntegrityError:
            return JsonResponse({"message":"Username already taken"},status=400)

        login(request,user)
        return HttpResponseRedirect(reverse("index"))

    return render(request,'service/access.html')


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("login"))


@login_required
def create_project(request):
    if request.method == "POST":
        title = request.POST.get('title')
        # Should try to make this dynamic
        if Project.objects.filter(title=title).exists():
            return render(request,"service/profile.html",{"message":"This name already exists"})

        new_project = Project(title=title)
        new_project.save()
        membership = ProjectMembership(user=request.user, project=new_project, is_admin=True)
        membership.save()

        

        return HttpResponseRedirect(reverse("project",args=[new_project.id]))

    return HttpResponseRedirect(reverse("index"))


def project(request,id):
    project = Project.objects.get(pk=id)
    if ProjectMembership.objects.filter(project=project,user=request.user,is_admin=True).exists():
        is_admin=True
    else:
        is_admin=False
    
    return render(request,"service/project.html",{"project":project,"is_admin":is_admin})


@login_required
def send_invitation(request,projectId):
    if request.method != "POST":
        return JsonResponse({"message":"Invalid request"},status=400)
    
    if not ProjectMembership.objects.filter(user=request.user, project_id=projectId, is_admin=True).exists():
        return JsonResponse({"message":"You have no permission to make invitations for this project"},status=400)
    
    data = json.loads(request.body)
    invited_username = data.get('invited_username')

    receiver = User.objects.filter(username=invited_username).first()
    if receiver is None:
        return JsonResponse({"message":"this user doesn't exist"},status=404)
    
    if ProjectMembership.objects.filter(user=receiver,project_id=projectId).exists():
        return JsonResponse({"message":f"{invited_username} is already part of this project"},status=400)

    if Invitation.objects.filter(sender=request.user, receiver=receiver, project_id=projectId).exists():
        return JsonResponse({"message":f"You already invited {invited_username} to join the project"},status=400)

    invitation = Invitation(sender=request.user, receiver=receiver, project_id=projectId)
    invitation.save()
    return JsonResponse({"Success":True, "message":f"{invited_username} invited to join the project"},status=200)

# When accepting invitation invitation doesn't disappear
def invitation_accepted(request,invitation_id):
    if request.method != "POST":
        return JsonResponse({"message":"Invalid request"})
    
    invitation = get_object_or_404(Invitation, id=invitation_id, receiver=request.user)
    invitation.save()

    new_membership = ProjectMembership(user=request.user, project=invitation.project)
    new_membership.save()

    project = invitation.project
    invitation.delete()

    return HttpResponseRedirect(reverse("project",args=[project.id]))

def invitation_denied(request,invitation_id):
    invitation = get_object_or_404(Invitation, id=invitation_id, receiver=request.user)
    invitation.delete()

    return HttpResponseRedirect(reverse("profile"))


def get_more_messages(request,start,end,project_id):
    if request.method != "GET":
        return JsonResponse({"message":"Invalid request"},status=400)

    messages_query = ChatMessage.objects.filter(room_id=project_id).order_by("-timestamp")[start:end + 1]
    messages = [message.serialize() for message in messages_query]

    return JsonResponse({"messages":messages},status=200)



def upload_file(request):
    if request.method != "POST":
        return JsonResponse({"message":"Invalid request"},status=400)
    
    uploaded_file = request.FILES.get('uploaded_file','')
    name = request.POST.get('file_name','')
    project_id = request.POST.get('project_id','')

    print(uploaded_file)
    print(name)
    print(project_id)
    
    file_to_store = File(
        uploaded_by = request.user,
        # Why does this work instead of using get which returns matching query does not exist
        project = Project.objects.get(pk=project_id),
        name = name,
        file = uploaded_file,
    )
    file_to_store.save()

    return JsonResponse({"message":"File stored successfully", "file":file_to_store.serialize()}, status=200)

# Check if users on project is todo
def get_project_files(request,projectId):
    if request.method != "GET":
        return JsonResponse({"message":"Invalid request"},status=400)

    project_files = File.objects.filter(project=(Project.objects.get(pk=projectId)))
    if not project_files:
        return JsonResponse({"files":[],},status=200)

    return JsonResponse({"files":[file.serialize() for file in project_files],"any_files":True},status=200)


@login_required
def delete_file(request):
    if request.method != 'DELETE':
        return JsonResponse({"message":"Invalid request"},status=400)

    data = json.loads(request.body)
    file_id = data.get('file_id')
    file_to_delete = File.objects.get(pk=file_id)
    file_to_delete.delete()
    
    return JsonResponse({"success":True}, status=200)

# For production better check where to store files... github gives warnings also in dev mode
@login_required
def download_file(request,project_id,file_id):
    if ProjectMembership.objects.get(user_id=request.user.id, project_id=project_id):
        # Serve File
        file_object = get_object_or_404(File, id=file_id)
        
        response = FileResponse(open(file_object.file.path,'rb'))
        response['Content-Disposition'] = f'attachment; filename="{file_object.file.name}"'
        return response

    return JsonResponse({"message":"You have no permission to download the file"},status=400)

@login_required
def get_whiteboard_elements(request,project_id,whiteboard_id):   
    current_project = Project.objects.get(pk=project_id)
    whiteboard = ExcalidrawInstance.objects.get(pk=whiteboard_id,project=current_project)
    elements_list = whiteboard.elements

    return JsonResponse({"elements":elements_list},status=200)
    

@login_required
def get_whiteboards(request,project_id):
    current_project = Project.objects.get(pk=project_id)
    whiteboards = ExcalidrawInstance.objects.filter(project=current_project)
    return JsonResponse({"whiteboards":[whiteboard.serialize() for whiteboard in whiteboards]},status=200)


@login_required
def create_whiteboard(request):
    if request.method != 'POST':
        return JsonResponse({"message":"Invalid request"},status=400)

    data = json.loads(request.body)
    project_id = data.get('project_id')
    title = data.get('title')
    new_whiteboard = ExcalidrawInstance(
        title=title,
        created_by=request.user,
        project=Project.objects.get(pk=project_id)
    )
    new_whiteboard.save()

    return JsonResponse({"new_whiteboard":new_whiteboard.serialize(),"success":True},status=200)


@login_required
def delete_whiteboard(request):
    if request.method != 'DELETE':
        return JsonResponse({"message":"Invalid request"},status=400)

    data = json.loads(request.body)
    whiteboard_id = data.get('whiteboard_id')
    whiteboard_to_delete = ExcalidrawInstance.objects.get(pk=whiteboard_id)
    whiteboard_to_delete.delete()
    return JsonResponse({"message":"Whiteboard instance deleted","success":True},status=200)



    