import React from 'react'
import './ConfirmationWindow.css'

export default function ConfirmationWindow({message, onConfirm, onCancel}) {
    return (
        <div className="confirmation-window">
            <div className="confirmation-content">
                <p>{message}</p>
                <div className="confirmation-buttons">
                    <button className="confirm" onClick={onConfirm}>Yes</button>
                    <button className="cancel" onClick={onCancel}>No</button>
                </div>
            </div>
        </div>
    );
}