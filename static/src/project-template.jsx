// add the beginning of your app entry
import 'vite/modulepreload-polyfill'

import React from 'react'
import ReactDOM from 'react-dom/client'
import Project from './Project.jsx'

// React.StrictMode tags are deactivated because they caused re-renders and double connections of
// chat websockets.... if Strict Mode necessary you can clean up chat sockets with return statements 
// like chatSocket.close() but that will cause connecting and disconnecting the first time the component mounts

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <Project /> 
  </>,
)