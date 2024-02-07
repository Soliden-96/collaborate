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
    project = Project.objects.get(id=id)
    return render(request,"service/project.html",{"project":project})


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
    
    if ProjectMembership.objects.filter(user=receiver).exists():
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

# ?? Necessary ??
def get_thread(request,item_id):
    if request.method != "GET":
        return JsonResponse({"message":"Invalid request"},status=400)
    
    comments = Comment.objects.filter(item=(Item.objects.get(pk=item_id))).order_by("-created_at")
    if comments is None:
        return JsonResponse({"message":"This item has no comments"},status=404)

    return JsonResponse({"success":True,"comments":[comment.serialize() for comment in comments]},status=200)


def upload_file(request):
    if request.method != "POST":
        return JsonResponse({"message":"Invalid Request"},status=400)
    
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


def get_whiteboard_elements(request,project_id):
    try:
        current_project = Project.objects.get(pk=project_id)
        whiteboard = ExcalidrawInstance.objects.get(project=current_project)
        elements_list = whiteboard.elements
        return JsonResponse({"elements":elements_list},status=200)
    except ExcalidrawInstance.DoesNotExist:
        new_whiteboard = ExcalidrawInstance(project=current_project)
        new_whiteboard.save()
        return JsonResponse({"elements":[]},status=200)




    