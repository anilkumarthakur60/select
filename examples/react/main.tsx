import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import '@anil-labs/select-core/styles.css'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
