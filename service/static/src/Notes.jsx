import  React ,{ useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie';
import ConfirmationWindow from './ConfirmationWindow.jsx'
import './Notes.css'

export default function Notes({projectId, currentUsername, isAdmin}) {
    const [notes, setNotes] = useState([]);
    const [showNewNoteModal,setShowNewNoteModal] = useState(false);
    const [isLoading,setIsLoading] = useState(false);
    const [maxNotes,setMaxNotes] = useState(false);
    const notesSocketRef = useRef(null);
    const notesNumberRef = useRef(0)

    useEffect(() => {
        
        // Logic for debouncing infinite scrolling
        let timer;
        const handleScroll = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                handleWindowScroll();
            },200);
        }

        window.addEventListener('scroll',handleScroll)
        
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
                setNotes(data.notes);
                notesNumberRef.current = data.notes.length;
            } else if (data.type=='new_note') {
                setNotes((notes) => ([
                    data.new_note,
                    ...notes
                ]));
                notesNumberRef.current ++;
            } else if (data.type=='delete_note') {
                setNotes(notes => notes.filter(n => n.id !== data.note_id));
            } else if (data.type=='edit_note') {
                setNotes(notes => notes.map((note) => {
                    if (note.id===data.note_id) {
                        return {
                            ...note,
                            content:data.content
                        }
                    }
                    return note    
                }));
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
            window.removeEventListener('scroll',handleScroll);
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

    function editNote(noteId,noteContent) {
        notesSocketRef.current.send(JSON.stringify({
            'type':'edit_note',
            'note_id':noteId,
            'content':noteContent
        }));
        
    }

    function handleWindowScroll() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight && !isLoading && !maxNotes) {
            console.log('Bottom of the page');
            setIsLoading(true);
            loadMoreNotes();  
        }
    }
    

    function loadMoreNotes() {
        if (notesNumberRef.current % 9 == 0 && notesNumberRef.current > 0 ){
            const start = notesNumberRef.current + 1;
            const end = notesNumberRef.current + 9;
            console.log(start);
            console.log(end);
            fetch(`/get_more_notes/${start}/${end}/${projectId}`)
            .then(response => response.json())
            .then(data => {
                    data.notes.forEach(note => {
                        setNotes(notes => [
                            ...notes,
                            note,
                        ]);
                        console.log(`adding note ${note.id}`)
                        })
                    notesNumberRef.current += data.notes.length;
                    console.log(data.notes.length);
                    setIsLoading(false);  
                        })
            .catch(error => {
                console.log(error);
            })
        }
    }



    return (
        <>
        <div style={{textAlign:"center"}}>{notesNumberRef.current}</div>
        <div className="new-note-button-div">
            <button className="new-note-button" onClick={() => setShowNewNoteModal(!showNewNoteModal)}>New Note</button>
        </div>
        <div className="notes-container">
            <div className="notes">
                <NotesList notes={notes} handleDeleteNote={handleDeleteNote} currentUsername={currentUsername} isAdmin={isAdmin} editNote={editNote} />  
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

function NotesList({notes, currentUsername, handleDeleteNote, isAdmin, projectId, editNote}) { 
    const [showConfirmation,setShowConfirmation] = useState(false);
    const [noteToDelete,setNoteToDelete] = useState(null);
    const [editableContent,setEditableContent] = useState('');
    const [editNoteId,setEditNoteId] = useState('');
    const [showEditModal,setShowEditModal] = useState('');

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

    function startEditNote(noteId,noteContent) {
        setEditNoteId(noteId);
        setEditableContent(noteContent);
        setShowEditModal(true);
    }

    function hideEditNoteModal() {
        setShowEditModal(false)
    }

    return (
        <>
        {showEditModal && <EditNoteModal projectId={projectId} editNoteId={editNoteId} hideEditNoteModal={hideEditNoteModal} editableContent={editableContent} editNote={editNote} />}
            {notes.map((note) => (
                <div key={note.id} className="note">
                    {(note.created_by === currentUsername || isAdmin) && 
                        <div className="note-options">
                            <button className="delete-note" onClick={() => askDeleteNote(note.id)}>X</button>
                            <button className="edit-button" onClick={() => startEditNote(note.id,note.content)}>&#9998;</button>
                        </div>
                    }
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

function EditNoteModal({ projectId, editNoteId, editableContent, hideEditNoteModal, editNote}) {
    const [editNoteInput,setEditNoteInput] = useState(editableContent || '');
    

    function confirmEditNote(input) {
        editNote(editNoteId,editNoteInput);
        hideEditNoteModal();
    }
    return (
        <>
        <div className="new-note-modal">
            <textarea type="text" autoFocus className="note-textarea" onChange={(e) => setEditNoteInput(e.target.value)} placeholder="Write your note down" value={editNoteInput} />
            <div className="note-modal-buttons">
                <button className="confirm-note-button" onClick={confirmEditNote}>&#10004;</button>
                <button className="cancel-new-note" onClick={hideEditNoteModal}>X</button>
            </div>
        </div>
        </>
    )
}
