import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Inbox, Lock, Search, Shield, User } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import NeonInput from '../components/NeonInput'
import PageTransition from '../components/PageTransition'
import MessageCard from '../components/MessageCard'
import { api } from '../utils/api'
import type { Message } from '../utils/storage'
import { useVisitor } from '../utils/visitorContext'

type ApiMessage = {
  id: string
  sender_username: string
  content: string
  created_at: number
  reply?: string
  replied_at?: number
}

function CheckReplies() {
  const navigate = useNavigate()
  const { username } = useVisitor()
  const [password, setPassword] = useState('')
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError('Enter your password to unlock replies.')
      return
    }
    setLoading(true)
    setError('')
    setMessages(null)
    try {
      const data = await api.getMyReplies(password) as { messages?: ApiMessage[] }
      setMessages(
        (data.messages || []).map((msg) => ({
          id: msg.id,
          senderUsername: msg.sender_username,
          content: msg.content,
          createdAt: msg.created_at,
          reply: msg.reply,
          repliedAt: msg.replied_at,
        }))
      )
      setSearched(true)
      setPassword('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages.')
      setMessages([])
      setSearched(true)
    } finally {
      setLoading(false)
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
              <div className="form-icon form-icon-magenta">
                <Search size={24} />
              </div>
              <h2>Check Your Replies</h2>
              <p>Your password is required every time so only you can read owner replies.</p>
            </div>

            <form onSubmit={handleSearch} className="search-form">
              <div className="search-field">
                <User size={16} />
                <div className="readonly-username mono-text">{username}</div>
              </div>
              <div className="search-field">
                <Lock size={16} />
                <NeonInput
                  type="password"
                  value={password}
                  onChange={(value) => {
                    setPassword(value)
                    setError('')
                  }}
                  placeholder="Enter reply password..."
                  autoFocus
                />
              </div>
              <NeonButton type="submit" color="magenta" disabled={loading}>
                {loading ? (
                  <span className="loading-dots">Searching...</span>
                ) : (
                  <>
                    <Search size={18} />
                    Find Messages
                  </>
                )}
              </NeonButton>
            </form>

            <p className="form-hint form-hint-danger">
              <AlertTriangle size={12} />
              Ensure you enter the correct password. Multiple failed attempts are rate-limited for security.
            </p>

            <p className="form-hint">
              <Shield size={12} />
              Password checks happen on the secure server, not in your browser.
            </p>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="error-text"
              >
                <Lock size={14} />
                {error}
              </motion.p>
            )}

            {searched && messages !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="results-section"
              >
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <Inbox size={48} />
                    <h3>No messages found</h3>
                    <p>
                      Did you send a message first? Make sure you're using the same
                      private username on this device.
                    </p>
                  </div>
                ) : (
                  <div className="messages-list">
                    <p className="results-count">
                      Found {messages.length} message{messages.length !== 1 ? 's' : ''}
                    </p>
                    {messages.map((msg, i) => (
                      <MessageCard
                        key={msg.id}
                        message={msg}
                        index={i}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  )
}

export default CheckReplies
