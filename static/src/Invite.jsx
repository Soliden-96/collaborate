import  React ,{ useEffect, useState, useRef } from 'react'

import Cookies from 'js-cookie';
import './Invite.css';

export default function Invite({ projectId, isAdmin }) {
    const [invited,setInvited] = useState('');
    const [message,setMessage] = useState({});
    const [participants,setParticipants] = useState({});

    useEffect(() => {
        fetch(`/get_project_participants/${projectId}`,)
        .then(response => response.json())
        .then(data => {
            console.log(data.participants)
            setParticipants(data.participants);
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

    return (
        <>
        <div className="invitation-page">
            <h4>Invite people to collaborate on your project</h4>
            {message && <p className={`message-color-${message.color}`}>{message.message}</p>}
            <form onSubmit={handleSubmit}>
                <label>Who do you want to invite??</label>
                <input className="invitation-input" onChange={e => setInvited(e.target.value)} type="text" value={invited} />
                <button type="submit">Invite</button>
            </form>

            <h4>Participants</h4>
            {Object.values(participants).map((participant,index) => (
                <div key={participant.id} className="participant">
                    {participant.name}
                    {isAdmin ? (
                    <button onClick={() => changeAdminCondition(participant.id)} 
                        className={participant.is_admin ? "is-admin" : "not-admin"}>
                            {participant.is_admin ? "Is an admin" : "Not an admin"}
                    </button>
                    ) : (
                    <button className={participant.is_admin ? "is-admin" : "not-admin"}>
                        {participant.is_admin ? "Is an admin" : "Not an admin"}
                    </button>
                    )}
                </div>
            ))}
        </div>
        </>
    )
}