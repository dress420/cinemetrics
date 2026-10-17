import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Schriften lokal gehostet (schneller, offline-fähig, kein Google-Fonts-Tracking)
import '@fontsource-variable/inter'
import '@fontsource-variable/playfair-display'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

// PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      setInterval(() => reg.update(), 30 * 60 * 1000)
    }).catch(() => {})
  })
}
