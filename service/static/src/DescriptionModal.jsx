import React from 'react'

export default function DescriptionModal() {
    return (
        <div className="description-modal">
            <p>
                The purpose of this website is to create an environment where people can collaborate on projects in a quick and intuitive way.
            </p>
            <p>
                Once you register and log in you will find yourself on the main page where you can select a project on which they are already working, 
                create a new project, or respond to invitations to other projects.
            </p>
            <p>
                Inside a project users can switch tools to use, the "home page" tool <i className="fa-solid fa-house"></i> is selected as default.
            </p>
            <p>
                In the home page of a project you can see if you are an administrator and who is working on the project.
            </p>
            <p>
                Administrators have a golden icon next to the project title <i className="fa-solid fa-user-tie gold-user"></i> and are empowered to close projects, 
                remove participants from projects, edit or remove content, and change administrator status clicking on the user's icon
                <i className="fa-solid fa-user-tie"></i>  next to their name in the participants list. The icon is grey when the user is not an administrator, 
                and golden when the user is an administrator.
            </p>
            <p>
                The other tools are:
            </p>
            <p>
                "Chat" <i className="fa-solid fa-comment-dots"></i>: A chat for the participants of the project.
            </p>
            <p>
                "Notes" tool <i className="fa-solid fa-note-sticky"></i> : Quick notes can be posted and edited on this page.
            </p>
            <p>
                "Whiteboards" tool <i className="fa-solid fa-chalkboard-user"></i>: Enables real-time collaborative whiteboards
                 integrating <a href="https://excalidraw.com/"> Excalidraw </a> and provides server-side functionality so that users can manage multiple whiteboards 
                which are automatically saved to database. 
                To use the library functionality of Excalidraw it is recommended to first download the library and then browse your local memory to add the elements. 
            </p>
            <p>
                "Items" tool <i className="fa-solid fa-list"></i>: Here users can post an item and comment on it following a particular thread.
            </p>
            <p>
                "Files" tool <i className="fa-solid fa-folder-open"></i>: Users can share and download files using this tool.
            </p>

        </div>
    )
}