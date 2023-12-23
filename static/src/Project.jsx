import  React ,{ useEffect, useState, useRef } from 'react'
import './Project.css'
import Cookies from 'js-cookie';

const projectId = parseInt(document.querySelector('#project-info').dataset.project);
const tools = {
        'Invite':Invite,
        'Chat':Chat,
    }


    export default function Project() {
    const [selectedTool, setSelectedTool] = useState('');
    const currentTool = tools[selectedTool];
    return (
        <>
        <button onClick={() => setSelectedTool('Invite')}>Invite users</button>
        <button onClick={() => setSelectedTool('Chat')}>Chat</button>
        <Tool currentTool={currentTool} projectId={projectId} />
        </>
    )
}

function Tool({currentTool, projectId}) {
    const CurrentTool = currentTool;
    if (CurrentTool) {
        return (
            <>
            <CurrentTool projectId={projectId} />
            </>
        )
    } else {
        <></>
    }
}

function Invite({projectId}) {
    const [invited,setInvited] = useState('');
    const [message,setMessage] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        const csrfToken = Cookies.get('csrftoken');
        fetch(`/send_invitation/${projectId}`,{
            method:"POST",
            headers: {
                "Content-Type":"application/json",
                "X-CSRFToken": csrfToken,
            },
            body:JSON.stringify({
                invited_username:invited,
            })
        })
        .then(response => response.json())
        .then(result => {
            setMessage(result.message);
            setInvited('');
        })
        .catch(error => {
            setMessage("An error has occurred while processing your request");
        })
    }

    return (
        <>
        <h4>Invite people to collaborate on your project</h4>
        {message && <p>{message}</p>}
        <form onSubmit={handleSubmit}>
            <label>Who do you want to invite??</label>
            <input onChange={e => setInvited(e.target.value)} type="text" value={invited} />
            <button type="submit">Invite</button>
        </form>
        </>
    )
}


function Chat({projectId}) {
    const [chatLog,setChatLog] = useState([]);
    const [messageInput,setMessageInput] = useState('');
    const chatSocketRef = useRef(null);

    useEffect(() => {

        const chatSocket = new WebSocket(
            'ws://'
            + window.location.host 
            +'/ws/chat/'
            + projectId
            + '/'
        );

        chatSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            // Functional version is better for asynchronous environment, instead of  
            // updating like setChatLog(nextChatLog)
            setChatLog(chatLog => [...chatLog, data.message + '\n'].join(''));
        };
        
        //Pros and cons of closing when exiting chat tool to evaluate
        chatSocket.onclose = function(e) {
            console.error('Chat closed unexpectedly');
        };

        chatSocketRef.current = chatSocket;

        return () => {
            chatSocketRef.current.close();
        };

    },[projectId]);

    function handleSendMessage() {
        chatSocketRef.current.send(JSON.stringify({
            'message':messageInput
        }));
        setMessageInput('');
    }

    return (
        <div>
            <textarea value={chatLog} readOnly />
            <br />
            <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} />
            <br />
            <button onClick={handleSendMessage}>Send</button>
        </div>
    )
}