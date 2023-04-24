import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import {
  SecureCommunicationKey, registerSW
  , postCommunicationKey
} from 'securepushjs'
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

registerSW()

SecureCommunicationKey.create().then(key => {
  postCommunicationKey(key).catch(console.error)
}).catch(console.error)
