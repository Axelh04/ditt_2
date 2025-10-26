import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode is disabled to prevent duplicate API calls in development
// StrictMode intentionally runs effects twice to detect side effects,
// which was causing multiple expensive ElevenLabs API calls
createRoot(document.getElementById('root')!).render(
  <App />
)
