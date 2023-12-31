import  React ,{ useEffect, useState, useRef } from 'react'

import Cookies from 'js-cookie';

export default function Items({ projectId }) {
    const [itemTitle, setItemTitle] = useState('');
    const [descriptionInput, setDescriptionInput] = useState('');
    const [items, setItems] = useState([]);
    const [comments, setComments] = useState({});
    const [newCommentText, setNewCommentText] = useState({});
    const [isToggled, setIsToggled] = useState({});
    const itemSocketRef = useRef(null);
  
    useEffect(() => {
      const itemSocket = new WebSocket(
        'ws://' + window.location.host + '/ws/items/' + projectId + '/'
      );
  
      itemSocket.onmessage = function (e) {
        console.log('Message received');
        const data = JSON.parse(e.data);
        console.log(data);
        // Handle incoming messages...
        if (data.type==='items') {
          setItems(data.items.reverse());
          const initialComments = {} ;
          data.items.forEach((item) => {
            initialComments[item.item_id] = item.comments.reverse();
          })
          setComments(initialComments);
        } else if (data.type==='item') {
          setItems((items) => ([
            data.item,
            ...items
          ]));
          setComments((comments) => ({
            ...comments,
            [data.item.item_id] : []
          }));
        } else if (data.type==='comment') {
            console.log('comment incoming');
            setComments((comments) =>({
                ...comments,
                [data.item_id] : [
                    data.comment,
                    ...(comments[data.item_id] || [])
                    ]
            }));
            
        }
      };
  
      itemSocketRef.current = itemSocket;
      return () => {
        itemSocketRef.current.close();
      };
    }, [projectId]);
  
    function handleCreateItem() {
      console.log('sending item');
      // Handle item creation...
      
      itemSocketRef.current.send(JSON.stringify({
          'type':'item',
          'title':itemTitle,
          'description':descriptionInput,
      }));
      setItemTitle('');
      setDescriptionInput('');
      console.log('item sent');
    };
  
    function addComment(item_id) {
      console.log('sending comment');
      const text = newCommentText[item_id];
      console.log(text);
      if (!isToggled[item_id]) {
        toggleThread(item_id);
      }
      // Handle comment creation...
      itemSocketRef.current.send(JSON.stringify({
        'type':'comment',
        'text':text,
        'item_id':item_id
      }));
      setNewCommentText({
        ...newCommentText,
        [item_id]: '',
      });
    };
  
    function toggleThread(item_id) {
      // Handle thread toggle...
      setIsToggled({
        ...isToggled,
        [item_id]: !isToggled[item_id],
      })
    };
  
    function handleNewCommentChange(item_id, value) {
      setNewCommentText({
        ...newCommentText,
        [item_id]: value,
      });
    };
  
    return (
      <>
        <input
          type="text"
          placeholder="Item Title"
          value={itemTitle}
          onChange={(e) => setItemTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
        />
        <button onClick={handleCreateItem}>Create Item</button>
        <div className="items">
          {items.map((item) => (
            <Item
              key={item.item_id}
              item={item}
              comments={comments[item.item_id]}
              newCommentText={newCommentText}
              onToggleThread={toggleThread}
              onAddComment={addComment}
              onNewCommentChange={handleNewCommentChange}
              isToggled={isToggled}
            />
          ))}
        </div>
      </>
    );
  }
  
  function Item({item,comments,newCommentText,onToggleThread,onAddComment,onNewCommentChange,isToggled}) {
    return (
      <>
      <div key={item.item_id}>
        <div className="created_by">{item.created_by}</div>
        <div className="title">{item.title}</div>
        <div className="description">{item.description}</div>
        <div className="timestamp">{item.timestamp}</div>
      </div>
      <button onClick={() => onToggleThread(item.item_id)}>
      {isToggled[item.item_id] ? 'Hide thread' : 'Show thread'}
      </button>
      
      {isToggled[item.item_id] && <CommentsList comments={comments} />}
  
      <div className="add_comment">
          <input
            type="text"
            placeholder="Comment"
            value={newCommentText[item.item_id] || ''}
            onChange={(e) => onNewCommentChange(item.item_id, e.target.value)}
          />
          <button onClick={() => onAddComment(item.item_id)}>Add new comment</button>
      </div>
    </>
    )
  }
  
  
  function CommentsList({comments}) {
    
    return (
      <div className="comments">
        {Object.values(comments).map((comment) => (
          <div className="comment" key={comment.id}>
            <div className="created_by">{comment.created_by}</div>
            <div className="text">{comment.text}</div>
            <div className="timestamp">{comment.timestamp}</div>
            <hr />
          </div>
        ))}
      </div>
    );
  }
  