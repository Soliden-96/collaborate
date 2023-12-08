from django.shortcuts import render
from django.http import JsonResponse, HttpResponseRedirect
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse
from django.db import IntegrityError
from django.contrib.auth.decorators import login_required
import json

from .models import *

# Create your views here.


# You still get to login if you are logged in ... to fix 
def index(request):
    return render(request,'service/index.html')


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
    return render(request,"service/profile.html")


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
    return render(request,"service/project",{"project":project})
