import  React ,{ useEffect, useState, useRef } from 'react'
import { Excalidraw } from "@excalidraw/excalidraw";
import Cookies from 'js-cookie';

export default function WhiteboardMenu({projectId, userId, currentUsername}) {
    const [newWhiteboardTitle, setNewWhiteboardTitle] = useState('');
    const [whiteboards, setWhiteboards] = useState([]);
    const [selectedWhiteboardId, setSelectedWhiteboardId] = useState('');
 
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
    
    if (!selectedWhiteboardId){
        return (
            <>
            <div className="new-whiteboard">
                <h2>New whiteboard</h2>
                <form onSubmit={handleSubmit} className="new-whiteboard-form">
                    <input onChange={(e) => setNewWhiteboardTitle(e.target.value)} value={newWhiteboardTitle} type="text" placeholder="Whiteboard title" />
                    <button type="submit">Create Whiteboard</button>
                </form>
            </div>
            <div className="select-whiteboard">
                <h2>Select Whiteboard</h2>
                {whiteboards.map((whiteboard) => (
                    <div key={whiteboard.id} className="project-whiteboard">
                        <div className="whiteboard-title" onClick={() => setSelectedWhiteboardId(whiteboard.id)}>{whiteboard.title}</div>
                        {currentUsername===whiteboard.created_by && <button onClick={() => handleDeleteWhiteboard(whiteboard.id)}>Delete</button>}
                    </div>
                ))}
            </div>
            </>
            )
    } else {
        return (
            <>
            <button onClick={() => setSelectedWhiteboardId('')}>Back</button>
            <Whiteboard projectId={projectId} userId={userId} selectedWhiteboard={selectedWhiteboardId} />
            </>
        )
        }
}

function Whiteboard({projectId, userId, selectedWhiteboard}) {
    const whiteboardId = parseInt(selectedWhiteboard);
    const {data,loading} = useData(`/get_whiteboard_elements/${projectId}/${whiteboardId}`)
    
    // Using a custom hook to make sure that the Excalidraw component (in the Canvas component) is rendered with the correct initialData
    // Not doing so will cause the Excalidraw component to render before the initialData is loaded and 
    // trigger unexpected updates to the server due to the onChange prop 

    function useData(url) {
        const [data,setData] = useState({
            elements:[],
            appState: { zenModeEnabled: true, viewBackgroundColor: "#a5d8ff" },
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
            <Canvas projectId={projectId} userId={userId} initialData={data} whiteboardId={whiteboardId} />
        </div>
    )
}

function Canvas({projectId, userId, initialData, whiteboardId}) {
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);
    const socketRef = useRef(null);
    const isServerUpdate = useRef(false);
    const prevElements = useRef(initialData.elements);
    const prevAppState = useRef(initialData.appState);
    
    console.log('data coming')
    console.log(initialData);
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
            if (data.type==='update' && data.user_id!==userId) {
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

        return () => {
            socketRef.current.close();
        };

    },[whiteboardId,userId,excalidrawAPI]) // Adding excalidraw api to the dependencies ensures that it is already mounted otherwise it's null

    // Excalidraw onChange signature: (excalidrawElements, appState, files) => void;
    function handleDrawingChange(elements,appState) {
        console.log('handling..');
        const elementsChanged = JSON.stringify(elements) !== JSON.stringify(prevElements.current);
        const appStateChanged = JSON.stringify(appState) !== JSON.stringify(prevAppState.current);
        prevElements.current = elements;
        prevAppState.current = appState;
        // Need to implement additional check to avoid sending when just the appState changes
        if (elementsChanged || appStateChanged) {
            if (isServerUpdate.current) {
                isServerUpdate.current = false;
            } else if (socketRef.current.readyState === WebSocket.OPEN && !isServerUpdate.current) {
                console.log(elements);
                
                socketRef.current.send(JSON.stringify({
                    'excalidrawElements':elements,
                    'user_id':userId,
                }));
            };
        }
        
    }

    return (
        <>
        <h1 style={{ textAlign: "center" }}>Excalidraw Example</h1>
        <div style={{ height: "500px" }}>
            <Excalidraw 
            initialData={initialData}
            excalidrawAPI={(api)=> setExcalidrawAPI(api)}
            onChange={(elements,appState) => handleDrawingChange(elements,appState)}
            />
        </div>
        </>
    )
}

