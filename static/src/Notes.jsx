import  React ,{ useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie';

export default function Notes({projectId, currentUsername}) {
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
        <NewNote handleNewNote={handleNewNote} newNoteInput={newNoteInput} onNewNoteChange={handleNewNoteChange} projectId={projectId} />
        <NotesList notes={notes} handleDeleteNote={handleDeleteNote} currentUsername={currentUsername} />
        </>
    )
}


function NewNote({handleNewNote, projectId, newNoteInput, onNewNoteChange}) {
    return (
        <div className="new-note-div">
            <input type="text" onChange={(e) => onNewNoteChange(e.target.value)} placeholder="Write your note down" value={newNoteInput} />
            <button onClick={handleNewNote}>Create Note</button>
        </div>
    )
}

function NotesList({notes, currentUsername, handleDeleteNote}) { 

    return (
        <div className="notes">
            {notes.map((note) => (
                <div key={note.id} className="note">
                    <div className="note-creator">{note.created_by}</div>
                    <div className="note-content">{note.content}</div>
                    <div className="note-timestamp">{note.timestamp}</div>
                    {note.created_by === currentUsername && <button onClick={() => handleDeleteNote(note.id)}>Delete</button>}
                </div>
            ))}
        </div>
    )
}