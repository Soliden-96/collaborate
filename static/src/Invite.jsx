import  React ,{ useEffect, useState, useRef } from 'react'

import Cookies from 'js-cookie';

export default function Invite({ projectId, isAdmin }) {
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