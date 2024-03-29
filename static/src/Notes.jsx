import  React ,{ useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie';
import ConfirmationWindow from './ConfirmationWindow.jsx'
import './Notes.css'

export default function Notes({projectId, currentUsername, isAdmin}) {
    const [newNoteInput, setNewNoteInput] = useState('');
    const [notes, setNotes] = useState([]);
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

    function handleNewNoteChange(value) {
        setNewNoteInput(value);
    }

    function handleNewNote() {
        notesSocketRef.current.send(JSON.stringify({
            'type': 'new_note',
            'content':newNoteInput,
            'project_id':projectId
        }));
        setNewNoteInput('');
    }

    function handleDeleteNote(noteId) {
        const note_id = parseInt(noteId);
        notesSocketRef.current.send(JSON.stringify({
            'type': 'delete_note',
            'note_id':note_id
        }));
    }

    return (
        <>
        <div className="notes-container">
            <div className="new-note-div">
                <NewNote handleNewNote={handleNewNote} newNoteInput={newNoteInput} onNewNoteChange={handleNewNoteChange} projectId={projectId} />
            </div>
            <div className="notes">
                <NotesList notes={notes} handleDeleteNote={handleDeleteNote} currentUsername={currentUsername} isAdmin={isAdmin} />  
            </div>       
        </div>
        
        </>
    )
}


function NewNote({handleNewNote, projectId, newNoteInput, onNewNoteChange}) {
    return (
        <>
            <textarea type="text" className="note-textarea" onChange={(e) => onNewNoteChange(e.target.value)} placeholder="Write your note down" value={newNoteInput} />
            <div className="new-note-button-div">
                <button className="new-note-button" onClick={handleNewNote}>Add Note</button>
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

