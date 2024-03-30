import  React ,{ useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie';
import ConfirmationWindow from './ConfirmationWindow.jsx'
import './Notes.css'

export default function Notes({projectId, currentUsername, isAdmin}) {
    const [notes, setNotes] = useState([]);
    const [showNewNoteModal,setShowNewNoteModal] = useState(false);
    const notesSocketRef = useRef(null);

    useEffect(() => {
        
        const notesSocket = new WebSocket(
            'ws://'
            + window.location.host 
            +'/ws/notes/'
            + projectId
            + '/'
        );

        notesSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            console.log(data.type);
            if (data.type=='notes') {
                setNotes(data.notes.reverse());
            } else if (data.type=='new_note') {
                setNotes((notes) => ([
                    data.new_note,
                    ...notes
                ]))
            } else if (data.type=='delete_note') {
                setNotes(notes => notes.filter(n => n.id !== data.note_id));
            }

        };

        notesSocket.onerror = function (e) {
            console.error('Notes socket error:', e);
         };

        notesSocket.onclose = function (e) {
            console.log('Notes socket closed');
        };

        notesSocketRef.current = notesSocket;

        return () => {
            notesSocketRef.current.close();
        }
    },[projectId]);


    function handleNewNote(content) {
        notesSocketRef.current.send(JSON.stringify({
            'type': 'new_note',
            'content':content,
            'project_id':projectId
        }));
        setShowNewNoteModal(false);
    }

    function handleDeleteNote(noteId) {
        const note_id = parseInt(noteId);
        notesSocketRef.current.send(JSON.stringify({
            'type': 'delete_note',
            'note_id':note_id
        }));
    }

    function hideNewNoteModal() {
        setShowNewNoteModal(false);
    }

    return (
        <>
        <div className="new-note-button-div">
            <button className="new-note-button" onClick={() => setShowNewNoteModal(!showNewNoteModal)}>New Note</button>
        </div>
        <div className="notes-container">
            <div className="notes">
                <NotesList notes={notes} handleDeleteNote={handleDeleteNote} currentUsername={currentUsername} isAdmin={isAdmin} />  
            </div>       
        </div>
        {showNewNoteModal && <NewNoteModal hideNewNoteModal={hideNewNoteModal} handleNewNote={handleNewNote}   projectId={projectId} />}
        </>
    )
}


function NewNoteModal({handleNewNote, projectId, hideNewNoteModal}) {
    const [newNoteInput,setNewNoteInput] = useState('');

    function confirmNewNote(input) {
        handleNewNote(input);
        setNewNoteInput('');
    }
    return (
        <>
        <div className="new-note-modal">
            <textarea type="text" autoFocus className="note-textarea" onChange={(e) => setNewNoteInput(e.target.value)} placeholder="Write your note down" value={newNoteInput} />
            <div className="note-modal-buttons">
                <button className="confirm-note-button" onClick={() => confirmNewNote(newNoteInput)}>&#10004;</button>
                <button className="cancel-new-note" onClick={hideNewNoteModal}>X</button>
            </div>
        </div>
        </>
    )
}

function NotesList({notes, currentUsername, handleDeleteNote, isAdmin}) { 
    const [showConfirmation,setShowConfirmation] = useState(false);
    const [noteToDelete,setNoteToDelete] = useState(null);

    function askDeleteNote(noteId) {
        setNoteToDelete(noteId);
        setShowConfirmation(true);
    }

    function confirmDelete() { 
        setShowConfirmation(false);
        handleDeleteNote(noteToDelete);
    }

    function cancelDelete() {
        setShowConfirmation(false);
        setNoteToDelete(null);
    }

    return (
        <>
            {notes.map((note) => (
                <div key={note.id} className="note">
                    {(note.created_by === currentUsername || isAdmin) && <button className="delete-note" onClick={() => askDeleteNote(note.id)}>X</button>}
                    <div className="note-creator">{note.created_by}</div>
                    <div className="note-timestamp">{note.timestamp}</div>
                    <div className="note-content">{note.content}</div>
                    
                </div>
            ))}

            {showConfirmation && (
                <ConfirmationWindow 
                    message="Are you sure you want to delete this note??"
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </>
    )
}

