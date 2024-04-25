import React from 'react';
import './MessageModal.css';

export default function MessageModal({message,resetMessage}) {

    return (
        <div className="message-modal">
            <div className="message-div">
            {message}
            </div>
            <button className="close-message" onClick={() => resetMessage('')}>Close</button>
        </div>
    )
}