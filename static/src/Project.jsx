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
const tools = {
        'Invite':Invite,
        'Chat':Chat,
        'Items':Items,
        'FileRepo':FileRepo,
        'Notes':Notes,
        'WhiteboardMenu':WhiteboardMenu
    }


export default function Project({}) {
  const [selectedTool, setSelectedTool] = useState('');
  const currentTool = tools[selectedTool];
  useEffect(() => {
    console.log('project' + projectId);
    console.log('user' + userId);
  })
  return (
      <>
      <button onClick={() => setSelectedTool('Invite')}>Invite users</button>
      <button onClick={() => setSelectedTool('Chat')}>Chat</button>
      <button onClick={() => setSelectedTool('Items')}>Items</button>
      <button onClick={() => setSelectedTool('FileRepo')}>Files</button>
      <button onClick={() => setSelectedTool('Notes')}>Notes</button>
      <button onClick={() => setSelectedTool('WhiteboardMenu')}>Whiteboard</button>
      <Tool currentTool={currentTool} projectId={projectId} userId={userId} currentUsername={currentUsername} />
      </>
  )
}

function Tool({currentTool, projectId, userId, currentUsername}) {
    const CurrentTool = currentTool;
    if (CurrentTool) {
        return (
            <>
            <CurrentTool projectId={projectId} userId={userId} currentUsername={currentUsername} />
            </>
        )
    } else {
        <></>
    }
}


