import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import 'leaflet/dist/leaflet.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            border: '1px solid #383a40',
            borderRadius: '12px',
            background: '#202124',
            color: '#f4f4f5',
          },
          success: { iconTheme: { primary: '#ff5578', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff5578', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
