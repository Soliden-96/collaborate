# Collab-Space

1. [Introduction](#introduction)
2. [Distinctiveness and Complexity](#distinctiveness-and-complexity)
3. [Files Overview](#files-overview)
4. [Usage](#usage)
5. [Quick guide](#quick-guide)

## Introduction

This application is meant to be submitted as capstone project for CS50's Web Programming with Python and Javascript 
The following README.md file addresses the requirements specified on the course's page.

## Distinctiveness and Complexity

I believe that my project meets the distinctiveness and complexity requirements for several reasons:

- The web application isn't similar to other assignments in this course because it allows people to create and collaborate on different projects, sharing notes, files, and using realtime tools like a chat and an [Excalidraw](https://excalidraw.com/) integration, enriched by the possibility of saving the whiteboards in a persistent way.

- My application uses Django on the backend and Javascript/React on the frontend.

- The application is fully mobile responsive (although features like whiteboards can be better used on a computer).

- The web application is more complex than the projects completed throughout the course because of several reasons:
    - It enables realtime functionality using django channels.
    - It uses exstensively React, which was only briefly explained throughout the course.
    - Connects 4 services: Frontend, Backend, Postgres, Redis using Docker and the modern build tool Vite.
    - Uses covering indexes on the postgres database and caches Django's middleware and sessions with the same redis service that powers channels/websockets groups.
     

## Files overview

Collaborate is the project's directory, which contains the main settings.py file, I added asgi.py which provides setup for django-channels.

The node_modules folder contains packages necessary for the frontend.

Service is the directory of the app folder which contains:
- media/filerepo directory which is used to store uploaded files while the application is still in development mode.
- static/src contains all jsx and css files that are used on the frontend.
- static/src/dist directory which contains the app background image, and will serve as an output for a future build before deployment to production.
- templates directory contains the templates that constitute the starting point for the frontend, and are extended by the static/src files and the vite server
- besides the well known views.py, urls.py and models.py, there is a routing.py file which provides the url patterns to be used by django channels, and a consumers.py file which handles the logic of the web socket consumers.

.eslintrc.cjs is the linter for React.

.gitignore is used by git.

Dockerfile.backend, Dockerfile.frontend and compose.yaml are part of the docker configuration.

Requirements.txt is used by docker to install the necessary packages.

Package.json and package-lock.json manage javascript dependencies.

Vite.config.js configures Vite.

## Usage
""Please note that the application is still in development mode""
At the time of the latest commit, the application uses Docker version 24.0.7 and Docker Compose version v2.21.0, make sure that you have them both installed, then pull the repository.
You should first build the docker image locally with the "docker compose build" command and then run the application using the "docker compose up" command.
You should be able to use the application at localhost:8000. 

## Quick guide

The purpose of this website is to create an environment where people can collaborate on projects in a quick and intuitive way.

Once you register and log in you will find yourself on the main page where you can select a project on which they are already working, create a new project, or respond to invitations to other projects.

Inside a project users can switch tools to use, the "home page" tool is selected as default.

In the home page of a project you can see if you are an administrator and who is working on the project.

Administrators have a golden icon next to the project title and are empowered to close projects, remove participants from projects, edit or remove content, and change administrator status clicking on the user's icon next to their name in the participants list. The icon is grey when the user is not an administrator, and golden when the user is an administrator.

The other tools are:

- **Chat** : A chat for the participants of the project.
- **Notes** : Quick notes can be posted and edited on this page.
- **Whiteboards** : Enables real-time collaborative whiteboards integrating [Excalidraw](https://excalidraw.com/) and provides server-side functionality so that users can manage multiple whiteboards which are automatically saved to database. To use the library functionality of Excalidraw it is recommended to first download the library and then browse your local memory to add the elements.
- **Items** : Here users can post an item and comment on it following a particular thread.
- **Files** : Users can share and download files using this tool.





 
