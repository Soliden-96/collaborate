import  React ,{ useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie'
import './Chat.css'

export default function Chat({ projectId, currentUsername }) {
    const [isToggled,setIsToggled] = useState(false);

    return (
        <div className="chat-container">
            <button onClick={() => setIsToggled(!isToggled)} className="chat-button"><i className="fa-solid fa-comment-dots"></i></button>
            
            {isToggled && <ChatBox projectId={projectId} currentUsername={currentUsername} />}
            
        </div>
    )  
} 

function ChatBox({ projectId, currentUsername }) {
    const [chatLog,setChatLog] = useState([]);
    const [messageInput,setMessageInput] = useState('');
    const chatSocketRef = useRef(null);
    const messagesNumberRef = useRef(0);
    const totalMessagesRef = useRef(0);
    const heightRef = useRef(null);
 

    useEffect(() => {
        const chatLogElement = document.querySelector('#chat-log');
        chatLogElement.addEventListener('scroll',() => handleScroll(chatLogElement));
        heightRef.current = chatLogElement.scrollHeight;

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
                setChatLog(chatLog => data.chat_history.map((message,index)=> 
                <li key={message.id} className={message.sender===currentUsername ? "self" : "other"}>
                    <div className="bubble">
                        <div className="sender">{message.sender}</div>
                        <div className="message">{message.message}</div>
                        <div className="timestamp">{message.timestamp}</div>
                    </div>
                </li>
                ).reverse());
                messagesNumberRef.current = data.chat_history.length;
                totalMessagesRef.current = data.total_messages;
                setTimeout(() => {
                    const height = chatLogElement.scrollHeight;
                    chatLogElement.scrollTop = height; 
                },0);
            
            } else {

            setChatLog(chatLog => [
                ...chatLog, 
                (
                    <li key={data.message.id} className={data.message.sender===currentUsername ? "self" : "other"}>
                        <div className="bubble">
                            <div className="sender">{data.message.sender}</div>
                            <div className="message">{data.message.message}</div>
                            <div className="timestamp">{data.message.timestamp}</div>
                        </div>
                    </li>
                )]
            );
            messagesNumberRef.current++;
            totalMessagesRef.current++;
            setTimeout(() => {
                const height = chatLogElement.scrollHeight;
                chatLogElement.scrollTop = height; 
            },0);
            }
        };
        
        chatSocket.onerror = function (event) {
            console.error('Chat socket error:', event);
         };
         
        
        chatSocket.onclose = function(e) {
            console.error('Chat closed unexpectedly');
        };

        chatSocketRef.current = chatSocket;

        return () => {
            chatLogElement.removeEventListener('scroll',handleScroll);
            chatSocketRef.current.close();
        };

    },[projectId]);

    function handleScroll(chatLogElement) {
            if (chatLogElement.scrollTop == 0) {
                loadMoreMessages(chatLogElement);
            }
        }
        
    function loadMoreMessages(chatLogElement) {
        const height = chatLogElement.scrollHeight;
        if (messagesNumberRef.current >= 10 && messagesNumberRef.current < totalMessagesRef.current) {
            const start = messagesNumberRef.current;
            const end = messagesNumberRef.current + 9;
            console.log("start" + start);
            console.log("end" + end)
            fetch(`/get_more_messages/${start}/${end}/${projectId}`)
            .then(response => response.json())
            .then(data => {
                data.messages.forEach(message => 
                    setChatLog(chatLog => [ 
                        (
                            <li key={message.id} className={message.sender===currentUsername ? "self" : "other"}>
                                <div className="bubble">
                                    <div className="sender">{message.sender}</div>
                                    <div className="message">{message.message}</div>
                                    <div className="timestamp">{message.timestamp}</div>
                                </div>
                            </li>
                        ),
                        ...chatLog,
                        ]
                    )
                    );
                messagesNumberRef.current += 10;
                setTimeout(() => {
                    const newHeight = chatLogElement.scrollHeight;
                    chatLogElement.scrollTop = newHeight - height;
                });
            })
        }
    }

     

    function handleSendMessage() {
        chatSocketRef.current.send(JSON.stringify({
            'message':messageInput
        }));
        setMessageInput('');
    }

    return ( 
        <>
        <div className="chat-popup">
            <div id="chat-log">{chatLog}</div>
            <div className="chat-form">
                <textarea value={messageInput} onChange={(e) => setMessageInput(e.target.value)} />
                <button className="send-button" onClick={handleSendMessage}>&#10148;</button>
            </div>
        </div>
        </>
    )
}