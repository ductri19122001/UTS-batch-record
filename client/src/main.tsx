import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Auth0Provider from './auth/Auth0Provider'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  </StrictMode>,
)
