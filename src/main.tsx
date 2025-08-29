import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Monaco workers must be configured before any editor code runs
import './setup/monacoWorkers'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
