from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponseRedirect
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse
from django.db import IntegrityError
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
import json

from .models import *

# Create your views here.


# You still get to login if you are logged in ... to fix 
def index(request):
    return render(request,'service/index.html')

# To fix, i don't want it csrf exempt but it's not reading the cookies if go to localhost without click
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
        
    return HttpResponseRedirect(reverse("index"))


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
        
        # Change to directly login
        return JsonResponse({"message":"Successfully registered, now you can login"})

    return HttpResponseRedirect(reverse("index"))


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


@login_required
def profile(request):
    invitations = Invitation.objects.filter(receiver=request.user)
    project_memberships = ProjectMembership.objects.filter(user=request.user)
    projects = [membership.project for membership in project_memberships]
    return render(request, "service/profile.html", {"invitations": invitations, "projects": projects})


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
        return JsonResponse({"message":f"{invited_username} is already part of this project"})

    invitation = Invitation(sender=request.user, receiver=receiver, project_id=projectId)
    invitation.save()
    return JsonResponse({"Success":True, "message":f"{invited_username} invited to join the project"},status=200)

# When accepting invitation invitation doesn't disappear
def invitation_accepted(request,invitation_id):
    if request.method != "POST":
        return JsonResponse({"message":"Invalid request"})
    
    invitation = get_object_or_404(Invitation, id=invitation_id, receiver=request.user, is_accepted=False)
    invitation.is_accepted = True
    invitation.save()

    new_membership = ProjectMembership(user=request.user, project=invitation.project)
    new_membership.save()

    project = invitation.project

    return HttpResponseRedirect(reverse("project",args=[project.id]))

def invitation_denied(request,invitation_id):
    invitation = get_object_or_404(Invitation, id=invitation_id, receiver=request.user)
    invitation.delete()

    return HttpResponseRedirect(reverse("profile"))

