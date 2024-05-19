import  React ,{ useState } from 'react'
import './Access.css'
import DescriptionModal from './DescriptionModal.jsx'
import Cookies from 'js-cookie';

export function Access() {
  const [user,setUser] = useState(true);
  const [descriptionToggled,setDescriptionToggled] = useState(false);

  function toLogin() { 
    setUser(true);
  }

  function toRegister() {
    setUser(false);
  }
 
  
  return ( 
    <>
    <div className="app-introduction">
      <h1 className="app-title">Collab - Space</h1>
      <div >
        <button className="app-description-toggle" onClick={() => setDescriptionToggled(!descriptionToggled)}>Quick Guide</button>
      </div>
      {descriptionToggled && <DescriptionModal />}
    </div>
    <div className="access-options">
      <Switch toLogin={toLogin}  toRegister={toRegister} />
      {user ? <Login /> : <Register />}
    </div>
    </>
  )
}

  
function Switch({toLogin,toRegister}) {
  return(
    <>
    <div className="access-switch">
      <button onClick={toLogin}>Login</button>
      <button className="switch-register-btn" onClick={toRegister}>Register</button>
    </div>
    </>
  )
}


function Login() {

  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [message,setMessage] = useState('');

  function loginUser(username,password) {
    const csrfToken = Cookies.get('csrftoken');
    fetch("/login",{
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "X-CSRFToken":csrfToken
      },
      body: JSON.stringify({
        username:username,
        password:password,
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        window.location.href = "/";
      } else {
        setMessage(result.message);
      }
      console.log(result);  
    })
    .catch(error => {
      console.log(error);
      setMessage("An error occurred while processing your request");
    });
  }

  function handleSubmit(e){
    e.preventDefault();
    loginUser(username,password);
  }

  return ( 
      <>
      <div className="access-form">
        {message && <p className="error-message">{message}</p>}
        <form onSubmit={handleSubmit}>
          <input onChange={e => setUsername(e.target.value)} type="text" placeholder="username" value={username} />
          <input onChange={e => setPassword(e.target.value)} type="password" placeholder="password" value={password} />
          <button type="submit">Login</button>
        </form>
      </div>
      </>
  )
}


function Register() {

  const [username,setUsername] = useState(''); 
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [confirmation,setConfirmation] = useState('');
  const [message,setMessage] = useState('');

  function registerUser(username,email,password,confirmation) {
    const csrfToken = Cookies.get('csrftoken');
    fetch('/register',{
      method: "POST",
      headers:{
        "Content-Type":"application/json",
        "X-CSRFToken": csrfToken
      },
      body:JSON.stringify({
        username:username,
        email:email,
        password:password,
        confirmation:confirmation
      })
    })
    .then(response => response.json())
    .then(result =>{
      console.log(result);
      if (result.success) {
        window.location.href = "/";
      }
      setMessage(result.message);
    })
    .catch(error => {
      console.log(error); 
      setMessage('An error occurred while processing your request');
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    registerUser(username,email,password,confirmation);
  }

  return (
    <>
    <div className="access-form">
      {message && <p className="error-message">{message}</p>}
      <form onSubmit={handleSubmit}>
        <input onChange={e => setEmail(e.target.value)} type="email" placeholder="email" value={email} />
        <input onChange={e => setUsername(e.target.value)} type="text" placeholder="username" value={username} />
        <input onChange={e => setPassword(e.target.value)} type="password" placeholder="password" value={password} />
        <input onChange={e => setConfirmation(e.target.value)} type="password" placeholder="confirm password" value={confirmation} />
        <button type="submit">Register</button>
      </form>
    </div>
    </>
  )
}

