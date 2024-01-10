import  React ,{ useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie';

export default function Notes({projectId}) {
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
            'content':newNoteInput,
            'project_id':projectId
        }));
        setNewNoteInput('');
    }

    return (
        <>
        <NewNote handleNewNote={handleNewNote} newNoteInput={newNoteInput} onNewNoteChange={handleNewNoteChange} projectId={projectId} />
        <NotesList notes={notes} />
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

function NotesList({notes}) {
    return (
        <div className="notes">
            {notes.map((note) => (
                <div key={note.id} className="note">
                    <div className="note-creator">{note.created_by}</div>
                    <div className="note-content">{note.content}</div>
                    <div className="note-timestamp">{note.timestamp}</div>
                </div>
            ))}
        </div>
    )
}