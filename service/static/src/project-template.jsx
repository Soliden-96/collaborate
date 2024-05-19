// add the beginning of your app entry
import 'vite/modulepreload-polyfill'

import React from 'react'
import ReactDOM from 'react-dom/client'
import Project from './Project.jsx'


// Avoided strict mode because it causes double renders on infinite scrolling

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <Project /> 
  </>,
)