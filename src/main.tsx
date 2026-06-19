import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './utils/auth'
import { VisitorProvider } from './utils/visitor'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VisitorProvider>
          <App />
        </VisitorProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
