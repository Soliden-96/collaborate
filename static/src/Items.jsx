import  React ,{ useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie';
import ConfirmationWindow from './ConfirmationWindow';

export default function Items({ projectId, currentUsername, isAdmin }) {
    const [itemTitle, setItemTitle] = useState('');
    const [descriptionInput, setDescriptionInput] = useState('');
    const [items, setItems] = useState([]);
    const [comments, setComments] = useState({});
    const [newCommentText, setNewCommentText] = useState({});
    const [isToggled, setIsToggled] = useState({});
    const itemSocketRef = useRef(null);
  
    useEffect(() => {
      console.log('Starting connection');
      const itemSocket = new WebSocket(
        'ws://' + window.location.host + '/ws/items/' + projectId + '/'
      );
      console.log('connection created');
  
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
          if (data.action==='create') {
            setItems((items) => ([
              data.item,
              ...items
            ]));
            setComments((comments) => ({
              ...comments,
              [data.item.item_id] : []
            }));
          } else if (data.action==='delete') {
            setItems((items) => items.filter(i => i.item_id !== data.item_id));
          }

        } else if (data.type==='comment') {
          if (data.action==='create') {
            console.log('comment incoming');
            setComments((comments) =>({
                ...comments,
                [data.item_id] : [
                    data.comment,
                    ...(comments[data.item_id] || [])
                    ]
            }));
          } else if (data.action==='delete') {
            setComments((comments) => ({
              ...comments,
              [data.item_id]: comments[data.item_id].filter(c => c.id !== data.comment_id)
            }));    
          }
        }
      };
      itemSocket.onerror = function (e) {
        console.error('Item socket error:', e);
      };

      itemSocket.onclose = function (e) {
        console.log('Item socket closed');
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
          'action':'create',
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
        'action':'create',
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

    function handleDeleteItem(itemId) {
      const item_id = parseInt(itemId);
      itemSocketRef.current.send(JSON.stringify({
        'type':'item',
        'action':'delete',
        'item_id':item_id
      }));
    }

    function handleDeleteComment(commentId,itemId) {
      const comment_id = parseInt(commentId);
      const item_id = parseInt(itemId);
      itemSocketRef.current.send(JSON.stringify({
        'type':'comment',
        'action':'delete',
        'item_id': item_id,
        'comment_id': comment_id
      }));
    }
  
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
              currentUsername={currentUsername}
              handleDeleteComment={handleDeleteComment}
              handleDeleteItem={handleDeleteItem}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </>
    );
  }
  
  function Item({item,comments,newCommentText,onToggleThread,onAddComment,onNewCommentChange,isToggled,currentUsername,handleDeleteItem,handleDeleteComment,isAdmin}) {
    const [showItemConfirmation,setShowItemConfirmation] = useState(false);

    function confirmDelete() {
      setShowItemConfirmation(false);
      handleDeleteItem(item.item_id);
    }

    function cancelDelete() {
      setShowItemConfirmation(false);
    }

    return (
      <>
      <div key={item.item_id}>
        <div className="created_by">{item.created_by}</div>
        <div className="title">{item.title}</div>
        <div className="description">{item.description}</div>
        <div className="timestamp">{item.timestamp}</div>
        {(item.created_by === currentUsername || isAdmin) && <button onClick={() => setShowItemConfirmation(true)}>Delete Item</button>}
      </div>

      {showItemConfirmation && (
        <ConfirmationWindow
          message="Are you sure you want to delete this item ?"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      <button onClick={() => onToggleThread(item.item_id)}>
      {isToggled[item.item_id] ? 'Hide thread' : 'Show thread'}
      </button>
      
      {isToggled[item.item_id] && <CommentsList comments={comments} currentUsername={currentUsername} itemId={item.item_id} handleDeleteComment={handleDeleteComment} isAdmin={isAdmin} />}
  
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
  
  
  function CommentsList({comments, currentUsername, itemId, handleDeleteComment, isAdmin }) {
    const [showCommentConfirmation,setShowCommentConfirmation] = useState(false);
    const [commentToDelete,setCommentToDelete] = useState(null);

    function askDeleteComment(commentId) {
      setCommentToDelete(commentId);
      setShowCommentConfirmation(true);
    }

    function confirmDelete() {
      setShowCommentConfirmation(false);
      handleDeleteComment(commentToDelete,itemId);
    }

    function cancelDelete() {
      setCommentToDelete(null);
      setShowCommentConfirmation(false);
    }
    
    // Object.values will return an array from the object keys so that you can map over it
    return (
      <>
      <div className="comments">
        {Object.values(comments).map((comment) => (
          <div className="comment" key={comment.id}>
            <div className="created_by">{comment.created_by}</div>
            <div className="text">{comment.text}</div>
            <div className="timestamp">{comment.timestamp}</div>
            {(comment.created_by === currentUsername || isAdmin) && <button onClick={() => askDeleteComment(comment.id,itemId)}>Delete</button> }
            <hr />
           </div>
        ))}
      </div>
      {showCommentConfirmation && (
        <ConfirmationWindow
          message="Are you sure you want to delete this comment ?"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
      </>
    );
  }
  