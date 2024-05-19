import  React ,{ useEffect, useState, useRef, lazy, Suspense } from 'react';
import './Project.css';
import Cookies from 'js-cookie';
import Chat from './Chat.jsx';
const Invite = React.lazy(() => import('./Invite.jsx'));
const Items = React.lazy(() => import('./Items.jsx'));
const FileRepo = React.lazy(() => import('./Files.jsx'));
const Notes = React.lazy(() => import('./Notes.jsx'));
const WhiteboardMenu = React.lazy(() => import('./Whiteboard.jsx'));


const projectId = parseInt(document.querySelector('#project-info').dataset.project);
const userId = parseInt(document.querySelector('#project-info').dataset.user);
const currentUsername = document.querySelector('#project-info').dataset.username;
const isAdmin = (document.querySelector('#project-info').dataset.is_admin) ==="True";
const tools = {
        'Notes':{'name':'Notes','component':Notes, 'icon':<i className="fa-solid fa-note-sticky"></i>},
        'WhiteboardMenu':{'name':'WhiteboardMenu','component':WhiteboardMenu, 'icon':<i className="fa-solid fa-chalkboard-user"></i>},
        'Invite':{'name':'Invite','component':Invite, 'icon':<i className="fa-solid fa-house"></i>},
        'Items':{'name':'Items','component':Items, 'icon':<i className="fa-solid fa-list"></i>},
        'FileRepo':{'name':'FileRepo','component':FileRepo, 'icon':<i className="fa-solid fa-folder-open"></i>}, 
    }


export default function Project({}) {
  const [selectedTool, setSelectedTool] = useState('Invite');
  let currentTool = null;
  if (selectedTool) {
    currentTool = tools[selectedTool].component;
  }
  console.log(isAdmin);

  function goBack() {
    window.location.href = '/';
  }

  return (
    <> 
    <div className="page-container">
        <button className="back-button" onClick={goBack}><i className="fa-solid fa-arrow-left-long"></i></button> 
        <div style={{ textAlign:'center' }}>
            <div className="menu-bar">
                {Object.keys(tools).map(tool => (
                    <button 
                        key={tools[tool].name}
                        id={tools[tool].name}
                        title={tools[tool].name}
                        className={selectedTool===tools[tool].name ? 'selected-tool':'not-selected'}
                        onClick={() => setSelectedTool(tools[tool].name)}
                    >
                        {tools[tool].icon}
                    </button>
                ))} 
            </div>
            
        </div>
        <Suspense>
            <Tool currentTool={currentTool} projectId={projectId} userId={userId} currentUsername={currentUsername} isAdmin={isAdmin} />
        </Suspense>
        <Chat projectId={projectId} currentUsername={currentUsername} />
    </div>
    </>
  )
}

function Tool({currentTool, projectId, userId, currentUsername, isAdmin }) {
    const CurrentTool = currentTool;
    if (CurrentTool) {
        return (
            <>
            <CurrentTool projectId={projectId}  userId={userId} currentUsername={currentUsername} isAdmin={isAdmin} />
            </>
        )
    } else {
        <></>
    }
}


