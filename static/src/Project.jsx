import  React ,{ useEffect, useState, useRef } from 'react';
import './Project.css';
import Cookies from 'js-cookie';
import Invite from './Invite.jsx';
import Chat from './Chat.jsx';
import Items from './Items.jsx';
import FileRepo from './Files.jsx';
import Notes from './Notes.jsx';
import WhiteboardMenu from './Whiteboard.jsx';


const projectId = parseInt(document.querySelector('#project-info').dataset.project);
const userId = parseInt(document.querySelector('#project-info').dataset.user);
const currentUsername = document.querySelector('#project-info').dataset.username;
const isAdmin = (document.querySelector('#project-info').dataset.is_admin) ==="True";
const tools = {
        'Invite':{'name':'Invite','component':Invite},
        'Items':{'name':'Items','component':Items},
        'FileRepo':{'name':'FileRepo','component':FileRepo},
        'Notes':{'name':'Notes','component':Notes},
        'WhiteboardMenu':{'name':'WhiteboardMenu','component':WhiteboardMenu}
    }


export default function Project({}) {
  const [selectedTool, setSelectedTool] = useState('');
  let currentTool = null;
  if (selectedTool) {
    currentTool = tools[selectedTool].component;
  }
  console.log(isAdmin);

  return (
      <>
      {isAdmin && <div>You are an admin on this project</div>}
        <div style={{ textAlign:'center' }}>
        <div className="menu-bar">
            {Object.keys(tools).map(tool => (
                <button 
                    key={tools[tool].name}
                    id={tools[tool].name}
                    className={selectedTool===tools[tool].name ? 'selected-tool':''}
                    onClick={() => setSelectedTool(tools[tool].name)}
                >
                    {tools[tool].name}
                </button>
            ))}
        </div>
        </div>
      <Tool currentTool={currentTool} projectId={projectId} userId={userId} currentUsername={currentUsername} isAdmin={isAdmin} />
      <Chat projectId={projectId} currentUsername={currentUsername} />
      </>
  )
}

function Tool({currentTool, projectId, userId, currentUsername, isAdmin }) {
    const CurrentTool = currentTool;
    if (CurrentTool) {
        return (
            <>
            <CurrentTool projectId={projectId} userId={userId} currentUsername={currentUsername} isAdmin={isAdmin} />
            </>
        )
    } else {
        <></>
    }
}


