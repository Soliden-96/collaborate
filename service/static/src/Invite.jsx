import  React ,{ useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie';
import './Invite.css'; 
import ConfirmationWindow from './ConfirmationWindow';

export default function Invite({ projectId, isAdmin, userId }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [invited, setInvited] = useState('');
    const [message, setMessage] = useState({});
    const [confirmationMessage,setConfirmationMessage] = useState('');
    const [confirmationFunction,setConfirmationFunction] = useState(() => () => {});
    const [participants, setParticipants] = useState({});

    useEffect(() => {
        fetch(`/get_project_info/${projectId}`,)
        .then(response => response.json())
        .then(data => {
            console.log(data.participants)
            setParticipants(data.participants);
            setTitle(data.project['title']);
            setDescription(data.project["description"]);
        })
        .catch(error => {
            console.log(error);
        })

    },[projectId])

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
            let messageColor;
            result.Success ? messageColor='green' : messageColor='red';
            setMessage({
                'message':result.message,
                'color':messageColor
            });
            setInvited('');
        })
        .catch(error => {
            console.log(error);
            setMessage("An error has occurred while processing your request");
        })
    }

    function changeAdminCondition(participantId) {
        const csrfToken = Cookies.get('csrftoken');
        fetch('/change_admin_condition',{
            method:'PUT',
            headers:{
                'Content-Type':"application/json",
                'X-CSRFToken':csrfToken
            },
            body:JSON.stringify({
                participant_id:participantId,
                project_id:projectId
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.message === 'Changed successfully') {
                setParticipants(prevParticipants => ({
                        ...prevParticipants,
                        [participantId]: {
                            ...prevParticipants[participantId],
                            is_admin: !prevParticipants[participantId].is_admin
                        }
                    })
                );
            }
        })
        .catch(error => {
            console.log(error);
        })
    }

    function removeFromProject(participantId) {
        const csrfToken = Cookies.get('csrftoken');
        fetch('/remove_from_project',{
            method:'DELETE',
            headers:{
                'Content-Type':'application/json',
                'X-CSRFToken':csrfToken
            },
            body:JSON.stringify({
                'participant_id':participantId,
                'project_id':projectId
            })
        })
        .then(response => {
            console.log(response);
            if (response.ok) { return response.json() }
        })
        .then(result => {
            if (result.message==='Project abandoned') {window.location.href="/"}
            // Using destructuring to remove from an object
            else {
                setConfirmationMessage('');
                setParticipants(prevParticipants => {
                const {[participantId]:_, ...remainingParticipants} = prevParticipants;
                return remainingParticipants
                }
            );
            }
        })
        .catch(error => {
            console.log(error);
        });
    }

    function closeProject() {
        const csrfToken = Cookies.get('csrftoken');
        fetch('/close_project',{
            method:'DELETE',
            headers:{
                "Content-Type":"application/json",
                "X-CSRFToken":csrfToken
            },
            body:JSON.stringify({
                'project_id':projectId
            })
        })
        .then(response => {
            if (response.ok) {window.location.href="/"}
            return response.json()
        })
        .then(result => {
            if (result.message) {console.log(result.message)}
        })
        .catch(error => {
            console.log(error);
        })
    }

    function cancelFunction() {
        setConfirmationMessage('');
    }
    

    return (
        <>
        {confirmationMessage && <ConfirmationWindow message={confirmationMessage} onConfirm={() => confirmationFunction()}  onCancel={() => cancelFunction()} />}
        <div className="home-page">
            <div className="project-section">
                <div className="project-header">
                    <h2 className="project-title">{title} {isAdmin && <i className="fa-solid fa-user-tie gold-user"></i>}</h2>
                    <p className="project-description">{description}</p>
                </div>
                
                <div className="project-options">
                    <button onClick={() => {
                        setConfirmationMessage("Are you sure that you want to leave this project??");
                        setConfirmationFunction(() => () => removeFromProject(userId))}}
                         className="leave-project-btn">Leave project</button>
                    {isAdmin && <button onClick={() => {
                                    setConfirmationMessage("Are you sure that you want to close this project??");
                                    setConfirmationFunction(() => () => closeProject())}}
                                    className="close-project-btn">Close Project</button>}
                </div>
            </div>
            
            
            <div className="participants-section">
                {isAdmin && (
                    <div className="invitations-div">
                        <h4>Invite people to collaborate on your project</h4>
                        {message && <p className={`message-color-${message.color}`}>{message.message}</p>}
                        <form onSubmit={handleSubmit}>
                            <input className="invitation-input" onChange={e => setInvited(e.target.value)} type="text" value={invited} placeholder="Name of the user" />
                            <button type="submit">Invite</button>
                        </form>
                    </div> 
                )}

                    <div className="participants-list-div">
                        <h4 className="participants-title">Participants</h4>
                        <div className="list">
                        {Object.values(participants).map((participant,index) => (
                            <div key={participant.id} className="participant">
                                {participant.name}
                                <span className="participant-options">
                                    {isAdmin ? (
                                    <button onClick={() => changeAdminCondition(participant.id)} 
                                        className={participant.is_admin ? "is-admin-btn" : "not-admin-btn"}>
                                            {participant.is_admin ? <i className="fa-solid fa-user-tie gold-user"></i> : <i className="fa-solid fa-user-tie grey-user"></i>}
                                    </button>
                                    ) : (
                                    <button className={participant.is_admin ? "is-admin-btn" : "not-admin-btn"}>
                                        {participant.is_admin ? <i className="fa-solid fa-user-tie gold-user"></i> : <i className="fa-solid fa-user-tie grey-user"></i>}
                                    </button>
                                    )}
                                    {isAdmin && <button onClick={() => {
                                                    setConfirmationMessage(`Are you sure that you want to exclude ${participant.name} from the project?? `);
                                                    setConfirmationFunction(() => () => removeFromProject(participant.id))}} 
                                                    className="remove-from-project-btn">X</button>}
                                </span>
                            </div>
                        ))}
                        </div>
                    </div>
            </div>  
        </div>
        </>
    )
}