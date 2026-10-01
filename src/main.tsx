import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './auth/AuthProvider'
import App from './App'
import './index.css'

const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={basename}>
        {/* Auth + cross-platform sync. The Firebase Auth SDK is dynamically
            imported inside the provider so signed-out visitors don't pay for it. */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)
