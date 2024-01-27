import  React ,{ useEffect, useState, useRef } from 'react'
import { Excalidraw } from "@excalidraw/excalidraw";
import Cookies from 'js-cookie';

export default function Whiteboard({projectId,userId}) {
    const {data,loading} = useData(`/get_whiteboard_elements/${projectId}`)
    
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
                const elements = data.elements;
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
            <Canvas projectId={projectId} userId={userId} initialData={data} />
        </div>
    )
}

function Canvas({projectId, userId, initialData}) {
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
            + projectId
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

    },[projectId,userId,excalidrawAPI]) // Adding excalidraw api to the dependencies ensures that it is already mounted otherwise it's null

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

