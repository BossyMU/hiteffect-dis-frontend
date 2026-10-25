import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { APP_ENV } from './config/env'
import './styles/index.css'

// Mark the browser tab of a test copy, so it isn't mistaken for production.
if (APP_ENV !== 'production') document.title = `[${APP_ENV.toUpperCase()}] ${document.title}`

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
