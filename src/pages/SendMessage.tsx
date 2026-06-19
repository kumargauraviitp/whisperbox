import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, CheckCircle, MessageSquare, Shield, Lock, User } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import NeonInput from '../components/NeonInput'
import PageTransition from '../components/PageTransition'
import { api } from '../utils/api'
import { useVisitor } from '../utils/visitorContext'

function SendMessage() {
  const navigate = useNavigate()
  const { username } = useVisitor()
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      setStatus('error')
      setErrorMsg('Please write a message')
      return
    }

    setStatus('loading')
    try {
      await api.sendMessage(message)
      setStatus('success')
      setMessage('')
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send message. Please try again.')
    }
  }

  return (
    <PageTransition>
      <div className="page-container">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <GlassCard>
          <div className="form-container">
            <div className="form-header">
              <div className="form-icon form-icon-cyan">
                <Send size={24} />
              </div>
              <h2>Send Anonymous Message</h2>
              <p>Your message is attached to your private username only.</p>
            </div>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="success-state"
                >
                  <CheckCircle size={64} className="success-icon" />
                  <h3>Message Sent!</h3>
                  <p>
                    Your message has been delivered securely to the server.
                    Come back later and check replies with your password.
                  </p>
                  <div className="success-meta">
                    <Shield size={14} />
                    <span>Supabase stored • Password protected</span>
                  </div>
                  <NeonButton color="green" onClick={() => setStatus('idle')}>
                    Send Another
                  </NeonButton>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="message-form"
                >
                  <div className="form-field">
                    <label className="form-label">
                      <User size={16} />
                      Sending As
                    </label>
                    <div className="readonly-username mono-text">{username}</div>
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      <MessageSquare size={16} />
                      Your Message
                    </label>
                    <NeonInput
                      type="textarea"
                      value={message}
                      onChange={setMessage}
                      placeholder="Write something honest..."
                      maxLength={500}
                      autoFocus
                    />
                    <div className="char-count">{message.length}/500</div>
                  </div>

                  {status === 'error' && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="error-text"
                    >
                      <Lock size={14} />
                      {errorMsg}
                    </motion.p>
                  )}

                  <NeonButton
                    type="submit"
                    color="cyan"
                    className="submit-btn"
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? (
                      <span className="loading-dots">Sending...</span>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Message
                      </>
                    )}
                  </NeonButton>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  )
}

export default SendMessage
