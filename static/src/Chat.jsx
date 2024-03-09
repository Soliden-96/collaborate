import  React ,{ useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie'
import './Chat.css'

export default function Chat({ projectId, currentUsername }) {
    const [isToggled,setIsToggled] = useState(false);

    return (
        <div className="chat-container">
            <button onClick={() => setIsToggled(!isToggled)} className="chat-button">Chat</button>
            <div className="chat-popup">
                {isToggled && <ChatBox projectId={projectId} currentUsername={currentUsername} />}
            </div>
        </div>
    )
}

function ChatBox({ projectId, currentUsername }) {
    const [chatLog,setChatLog] = useState([]);
    const [messageInput,setMessageInput] = useState('');
    const chatSocketRef = useRef(null);

    useEffect(() => {

        const chatSocket = new WebSocket(
            'ws://'
            + window.location.host 
            +'/ws/chat/'
            + projectId
            + '/'
        );
 
        chatSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);

            if (data.type === 'chat_history') {
                setChatLog(data.chat_history.map((message,index)=> 
                <div key={index}>
                    <div className="sender">{message.sender}</div>
                    <div className="message">{message.message}</div>
                    <div className="timestamp">{message.timestamp}</div>
                    <hr />
                </div>
                ).reverse());
            } else {
            // Functional version is better for asynchronous environment, instead of  
            // updating like setChatLog(nextChatLog)
            setChatLog(chatLog => [
                ...chatLog, 
                (
                    <div key={chatLog.length}>
                        <div className="sender">{data.sender}</div>
                        <div className="message">{data.message}</div>
                        <div className="timestamp">{data.timestamp}</div>
                        <hr />
                    </div>
                )]
            );
            }
        };
        
        chatSocket.onerror = function (event) {
            console.error('Chat socket error:', event);
            // Update state or perform actions as needed
         };
         
        
        chatSocket.onclose = function(e) {
            console.error('Chat closed unexpectedly');
        };

        chatSocketRef.current = chatSocket;
        //Pros and cons of closing when exiting chat tool to evaluate
        return () => {
            chatSocketRef.current.close();
        };

    },[projectId]);

    function handleSendMessage() {
        chatSocketRef.current.send(JSON.stringify({
            'message':messageInput
        }));
        setMessageInput('');
    }

    return (
        <>
            <div className="chat-log">{chatLog}</div>
            <br />
            <div className="chat-form">
                <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} />
                <br />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </>
    )
}