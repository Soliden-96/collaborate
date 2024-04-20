import  React ,{ useEffect, useState, useRef } from 'react'
import { Excalidraw } from "@excalidraw/excalidraw";
import Cookies from 'js-cookie';
import ConfirmationWindow from './ConfirmationWindow.jsx';
import './Whiteboard.css';

export default function WhiteboardMenu({projectId, userId, currentUsername, isAdmin}) {
    const [newWhiteboardTitle, setNewWhiteboardTitle] = useState('');
    const [whiteboards, setWhiteboards] = useState([]);
    const [selectedWhiteboardId, setSelectedWhiteboardId] = useState('');
    const [selectedTitle,setSelectedTitle] = useState('');
    const [whiteboardToDelete,setWhiteboardToDelete] = useState(null);
    const [showConfirmation,setShowConfirmation] = useState(false);
 
    useEffect(() => {
        fetch(`/get_whiteboards/${projectId}`,)
        .then(response => response.json())
        .then(data => {
            setWhiteboards(data.whiteboards);
        })
        .catch(error => {
            console.log(error);
        })
    },[projectId])

    function handleSubmit(event){
        event.preventDefault();
        const csrfToken = Cookies.get('csrftoken');
        fetch('/create_whiteboard',{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                'X-CSRFToken':csrfToken
            },
            body:JSON.stringify({
                'title': newWhiteboardTitle,
                'project_id':projectId,
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            if (result.success) {
                setWhiteboards(whiteboards => [
                    result.new_whiteboard,
                    ...whiteboards
                ]);
                setSelectedWhiteboardId(result.new_whiteboard.id);
                setNewWhiteboardTitle('');
            }

        })
        .catch(error => {
            console.log(error);
        })
    }

    function handleDeleteWhiteboard(whiteboardId) {
        const whiteboard_id = parseInt(whiteboardId);
        const csrftoken = Cookies.get('csrftoken');

        fetch('/delete_whiteboard',{
            method:'DELETE',
            headers:{
                'Content-Type':'application/json',
                'X-CSRFToken': csrftoken
            },
            body:JSON.stringify({
                'whiteboard_id': whiteboard_id
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                setWhiteboards(whiteboards => whiteboards.filter(w => w.id !== whiteboard_id));
            }
        })
        .catch(error => {
            console.log(error);
        })
    }

    function askDeleteWhiteboard(whiteboardId) {
        setWhiteboardToDelete(whiteboardId);
        setShowConfirmation(true);
    }

    function confirmDelete() {
        setShowConfirmation(false);
        handleDeleteWhiteboard(whiteboardToDelete);
    }

    function cancelDelete() {
        setWhiteboardToDelete(null);
        setShowConfirmation(false);
    } 


    
    if (!selectedWhiteboardId){
        return (
            <>
            <div className="whiteboard-menu">
                <div className="new-whiteboard">
                    <h2>New whiteboard</h2>
                    <form onSubmit={handleSubmit} className="new-whiteboard-form">
                        <input className="new-whiteboard-input" onChange={(e) => setNewWhiteboardTitle(e.target.value)} value={newWhiteboardTitle} type="text" placeholder="Whiteboard title" />
                        <button className="create-whiteboard-btn" type="submit">Create Whiteboard</button>
                    </form>
                </div>
                <div className="select-whiteboard">
                    <h2>Select Whiteboard</h2>
                    {whiteboards.map((whiteboard) => (
                        <div key={whiteboard.id} className="project-whiteboard">
                            <div className="whiteboard-title" onClick={() => {setSelectedWhiteboardId(whiteboard.id);setSelectedTitle(whiteboard.title);}}>{whiteboard.title}</div>
                            {(currentUsername===whiteboard.created_by || isAdmin) && <button className="delete-btn" onClick={() => askDeleteWhiteboard(whiteboard.id)}>&#x2717;</button>}
                        </div>
                    ))}
                </div>
                {showConfirmation && (
                    <ConfirmationWindow
                        message="Are you sure you want to delete this whiteboard??"
                        onConfirm={confirmDelete}
                        onCancel={cancelDelete}
                    />
                )}
            </div>
            </>
            )
    } else {
        return (
            <>
            <button onClick={() => setSelectedWhiteboardId('')}>Back</button>
            <Whiteboard projectId={projectId} userId={userId} selectedWhiteboard={selectedWhiteboardId} selectedTitle={selectedTitle} />
            </>
        )
        }
}

function Whiteboard({projectId, userId, selectedWhiteboard, selectedTitle}) {
    const whiteboardId = parseInt(selectedWhiteboard);
    const {data,loading} = useData(`/get_whiteboard_elements/${projectId}/${whiteboardId}`)
    
    // Using a custom hook to make sure that the Excalidraw component (in the Canvas component) is rendered with the correct initialData
    // Not doing so will cause the Excalidraw component to render before the initialData is loaded and 
    // trigger unexpected updates to the server due to the onChange prop 

    function useData(url) {
        const [data,setData] = useState({
            elements:[],
            appState: { zenModeEnabled: false, viewBackgroundColor: "#f5faff" },
            scrollToContent: true
        });

        const [loading,setLoading] = useState(true);
        useEffect(() => {
            const fetchData = async () => {
                const response = await fetch(url);
                const data = await response.json();
                const elements = data.elements || [];
                setData((prevData) => ({
                    ...prevData,
                    elements:elements
                }));
                setLoading(false);
            }
            fetchData()
        },[url]);
        return {data,loading};
    }

    if (loading) {
        return <h2>Loading...</h2>
    }

    return (
        <div className="whiteboard">
            <Canvas projectId={projectId} userId={userId} initialData={data}  whiteboardId={whiteboardId} title={selectedTitle} />
        </div>
    )
}

function Canvas({projectId, userId, initialData, whiteboardId, title}) {
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);
    const socketRef = useRef(null);
    const isServerUpdate = useRef(false);
    const isDrawing = useRef(false);
    const prevElements = useRef(initialData.elements);
    const prevAppState = useRef(initialData.appState);
    
    
    console.log('data coming');
    useEffect(() => {
        console.log('Connecting...');
        const socket = new WebSocket(
            'ws://'
            + window.location.host 
            +'/ws/draw/'
            + whiteboardId
            + '/'
        );
        socket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            console.log(data);
            if (data.type==='update_elements' && data.user_id!==userId) {
                console.log(data.excalidraw_elements);
                isServerUpdate.current = true;
                const sceneData = {
                    elements:data.excalidraw_elements   
                }
                excalidrawAPI.updateScene(sceneData);
                console.log('Scene Updated');
            }
        };
        socket.onerror = function(e) {
            console.log('Drawing socket error');
        };
        socket.onclose = function(e) {
            console.log('Drawing socket closed');
        };
        socketRef.current = socket;
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            socketRef.current.close();
            document.removeEventListener('keyup', handleKeyUp);
        };

    },[whiteboardId,userId,excalidrawAPI]) // Adding excalidraw api to the dependencies ensures that it is already mounted otherwise it's null


    function handlePointerDown(activeTool) {
        if (activeTool!=="hand") {
            console.log('Pointer Down');
            isDrawing.current = true;
            const intervalId = setInterval(() => {
                if (isDrawing.current) {
                    const elements = excalidrawAPI.getSceneElements();
                    sendSceneUpdate(elements);
                } else {
                    clearInterval(intervalId); // Clear the interval using the interval ID
                }
            }, 100) 
            excalidrawAPI.onPointerUp(() => handlePointerUp(intervalId));
        }
    }

    function handlePointerUp(intervalId) {
        console.log('Pointer up');
        clearInterval(intervalId);
        isDrawing.current = false;
        setTimeout(() => {
            const elements = excalidrawAPI.getSceneElements();
            sendSceneUpdate(elements);
            
        }, 50);
    }


    function handleKeyUp(event) {
        const elements = excalidrawAPI.getSceneElements();
        sendSceneUpdate(elements);
    }
    
    function sendSceneUpdate(elements) {
        socketRef.current.send(JSON.stringify({
            'message':'sending_elements',
            'excalidraw_elements':elements,
            'user_id': userId,
        }));
    }
    // Excalidraw onChange signature: (excalidrawElements, appState, files) => void;

    return (
        <>
        <h1 className="title" style={{ textAlign: "center" }}>{title}</h1>
        <div style={{ height: "500px" }}>
            <Excalidraw 
            initialData={initialData}
            UIOptions={{tools:{image:false}}}
            excalidrawAPI={(api)=> setExcalidrawAPI(api)}
            onPointerDown={(activeTool) => handlePointerDown(activeTool)}
            />
        </div>
        </>
    )
}

