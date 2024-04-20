import  React ,{ useEffect, useState, useRef } from 'react'
import Cookies from 'js-cookie';
import ConfirmationWindow from './ConfirmationWindow';
import "./Items.css";

export default function Items({ projectId, currentUsername, isAdmin }) {
    const [items, setItems] = useState([]);
    const [comments, setComments] = useState({});
    const [newCommentText, setNewCommentText] = useState({});
    const [isToggled, setIsToggled] = useState({});
    const [showItemModal,setShowItemModal] = useState(false);
    const [loading,setLoading] = useState(true);
    const itemSocketRef = useRef(null);
    const [pageButtons,setPageButtons] = useState([]);
    const [selectedPage, setSelectedPage] = useState(0);

    useEffect(() => {
      const totalPages = Math.ceil(items.length / 3);

      // The syntax here is Array.from(arrayLike, mapFN)
      // Initializes an array of the number of totalPages , each of its elements are initialized as undefined
      // Therefore in the map() function we store the undefined value as _, and use its index as value
      const newPageButtons = Array.from({ length: totalPages }, (_, index) => index);
    
      // Update the pageButtons state with the new array
      setPageButtons(newPageButtons);
    },[items.length])
  
    
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
          setLoading(false);

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
  
    function handleCreateItem(title,description) {
      console.log('sending item');
      // Handle item creation...
      
      itemSocketRef.current.send(JSON.stringify({
          'type':'item',
          'action':'create',
          'title':title,
          'description':description,
      }));
      setShowItemModal(false);
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

    function closeItemModal() {
      setShowItemModal(!showItemModal);
    }

    if (loading) {
      return ( <div>Loading</div> )
    } else {
  
    return (
      <>
        <button onClick={() => setShowItemModal(!showItemModal)}>Create Item</button>
        {showItemModal && <NewItemModal handleCreateItem={handleCreateItem} closeItemModal={closeItemModal} />}
        <div className="items">
          {items
            .slice(selectedPage * 3, selectedPage * 3 + 3)
            .map((item) => ( 
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
        <div className="items-pages">
          {pageButtons.map((button,index) => (
            <button key={index} onClick={() => setSelectedPage(index)} className="page-btn">{index + 1}</button>
          ))}
        </div>
      </>
    );
  }}

  function NewItemModal({handleCreateItem, closeItemModal}) {
    const [itemTitle,setItemTitle] = useState('');
    const [descriptionInput,setDescriptionInput] = useState('');
    return (
      <>
      <div className="new-item-modal">
        <div className="item-title-input">
          <input
            type="text"
            placeholder="Item Title"
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
          />
        </div>
        <div className="item-description-input">
          <textarea
            placeholder="Description"
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
          />
        </div>
        <div className="item-modal-buttons">
          <button onClick={() => handleCreateItem(itemTitle,descriptionInput)} className="confirm-item-button">&#10004;</button>
          <button onClick={closeItemModal} className="cancel-item-button">X</button>
        </div>
      </div>  
      </>
    )
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
      <div className="item" key={item.item_id}>
        {(item.created_by === currentUsername || isAdmin) && <button className="delete-item" onClick={() => setShowItemConfirmation(true)}>X</button>}
        <div className="title">{item.title}</div>
        <div className="description">{item.description}</div>
        <div className="timestamp">Item opened on {item.timestamp} by <span>{item.created_by}</span></div>
      </div>

      {showItemConfirmation && (
        <ConfirmationWindow
          message="Are you sure you want to delete this item ?"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      <button className={`toggle-comments ${isToggled[item.item_id] ? 'thread-shown' : 'thread-hidden'}`} onClick={() => onToggleThread(item.item_id)}>
      &#10148;
      </button>
       
      {isToggled[item.item_id] && <CommentsList comments={comments} currentUsername={currentUsername} itemId={item.item_id} handleDeleteComment={handleDeleteComment} isAdmin={isAdmin} />}
  
      <div className="add-comment">
          <textarea
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
            {(comment.created_by === currentUsername || isAdmin) && <button className="delete-comment" onClick={() => askDeleteComment(comment.id,itemId)}>X</button> }  
            <div className="created_by">{comment.created_by}</div>
            <div className="text">{comment.text}</div>
            <div className="timestamp">{comment.timestamp}</div>
            
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
  