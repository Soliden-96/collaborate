from django.shortcuts import render

# Create your views here.

def base(request):
    render(request,'service/base.html')
