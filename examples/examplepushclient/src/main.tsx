import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { SecureCommunicationKey, initSW } from 'securepushjs'
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
initSW(await SecureCommunicationKey.create())
// updateKey(await SecureCommunicationKey.create())
