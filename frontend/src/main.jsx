import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'
import 'leaflet/dist/leaflet.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><ThemeProvider><BrowserRouter><App /><Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: 'var(--toast-bg)', color: 'var(--toast-text)', border: '1px solid var(--line-strong)' } }} /></BrowserRouter></ThemeProvider></React.StrictMode>,
)
