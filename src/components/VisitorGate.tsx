import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Lock, Shield, Sparkles, User } from 'lucide-react'
import GlassCard from './GlassCard'
import NeonButton from './NeonButton'
import NeonInput from './NeonInput'
import { useVisitor } from '../utils/visitorContext'
import { subscribeToPush } from '../utils/push'

function VisitorGate() {
  const navigate = useNavigate()
  const { startSession } = useVisitor()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Choose a username and password before entering.')
      return
    }

    setLoading(true)
    try {
      await startSession(username, password)
      // Attempt to subscribe to push notifications
      subscribeToPush().catch(console.error)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create your username.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-container">
      <GlassCard>
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="visitor-gate"
          onSubmit={handleSubmit}
        >
          <div className="form-header">
            <div className="form-icon form-icon-cyan">
              <Sparkles size={24} />
            </div>
            <h2>Enter WhisperBox</h2>
            <p>
              Choose a username and password to start, or enter your existing credentials to log back in.
            </p>
          </div>

          <div className="message-form">
            <div className="form-field">
              <label className="form-label">
                <User size={16} />
                Username
              </label>
              <NeonInput
                value={username}
                onChange={(value) => {
                  setUsername(value)
                  setError('')
                }}
                placeholder="letters, numbers, dots, hyphens..."
                autoFocus
                maxLength={50}
              />
              <p className="form-hint">
                <Shield size={12} />
                If you already have this username, enter its password to log in. Otherwise, a new one is created.
              </p>
            </div>

            <div className="form-field">
              <label className="form-label">
                <Lock size={16} />
                Reply Password
              </label>
              <NeonInput
                type="password"
                value={password}
                onChange={(value) => {
                  setPassword(value)
                  setError('')
                }}
                placeholder="minimum 8 characters"
                maxLength={100}
              />
              <p className="form-hint form-hint-danger">
                <AlertTriangle size={12} />
                If you forget this password, your replies cannot be recovered because only the bcrypt password hash is stored.
              </p>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-text">
                <AlertTriangle size={14} />
                {error}
              </motion.p>
            )}

            <NeonButton type="submit" color="cyan" disabled={loading}>
              {loading ? 'Securing...' : 'Enter WhisperBox'}
            </NeonButton>
          </div>

          <button type="button" className="owner-link" onClick={() => navigate('/admin')}>
            Owner Login
          </button>
        </motion.form>
      </GlassCard>
    </div>
  )
}

export default VisitorGate
