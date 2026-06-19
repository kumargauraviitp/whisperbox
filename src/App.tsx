import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ParticleBackground from './components/ParticleBackground'
import VisitorGate from './components/VisitorGate'
import Home from './pages/Home'
import SendMessage from './pages/SendMessage'
import CheckReplies from './pages/CheckReplies'
import Admin from './pages/Admin'
import { useVisitor } from './utils/visitorContext'

function App() {
  const location = useLocation()
  const { username, isLoading } = useVisitor()
  const isAdminRoute = location.pathname === '/admin'

  return (
    <div className="app-wrapper">
      <ParticleBackground />
      <div className="content-layer">
        {isLoading && !isAdminRoute ? (
          <div className="home-container">
            <span className="loading-dots">Checking your private username...</span>
          </div>
        ) : !username && !isAdminRoute ? (
          <VisitorGate />
        ) : (
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/send" element={<SendMessage />} />
              <Route path="/replies" element={<CheckReplies />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default App
