import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Lock, Inbox, MessageSquare, CheckCircle, Clock, LogOut, Shield, AlertTriangle } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import PageTransition from '../components/PageTransition'
import MessageCard from '../components/MessageCard'
import { api } from '../utils/api'
import { useAuth } from '../utils/authContext'
import type { Message } from '../utils/storage'
import { useCallback } from 'react'

type AdminMessage = {
  id: string
  sender_username: string
  content: string
  created_at: number
  reply?: string
  replied_at?: number
}

type AdminStats = {
  total: number
  pending: number
  replied: number
}

function Admin() {
  const navigate = useNavigate()
  const { isAuthenticated, login, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [stats, setStats] = useState<AdminStats>({ total: 0, pending: 0, replied: 0 })
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)

  const loadData = useCallback(async () => {
    setDataLoading(true)
    try {
      const [msgData, statData] = await Promise.all([
        api.adminGetMessages(),
        api.adminGetStats(),
      ])
      const adminMessages = msgData.messages as AdminMessage[]
      setMessages(
        adminMessages.map((m) => ({
          id: m.id,
          senderUsername: m.sender_username,
          content: m.content,
          createdAt: m.created_at,
          reply: m.reply,
          repliedAt: m.replied_at,
        }))
      )
      setStats(statData as AdminStats)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('401') || message.includes('403') || message.includes('Unauthorized')) {
        logout()
      }
    } finally {
      setDataLoading(false)
    }
  }, [logout])

  useEffect(() => {
    if (isAuthenticated) {
      queueMicrotask(() => {
        void loadData()
      })
    }
  }, [isAuthenticated, loadData])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setLoading(true)
    try {
      await api.adminLogin(password)
      login()
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Invalid password.')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (id: string, reply: string) => {
    try {
      await api.adminReply(id, reply)
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert('Failed to send reply: ' + message)
    }
  }

  const handleLogout = () => {
    api.adminLogout().catch(() => { })
    logout()
  }

  return (
    <PageTransition>
      <div className="page-container">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GlassCard>
                <div className="pin-container">
                  <div className="pin-icon">
                    <Lock size={32} />
                  </div>
                  <h2>Owner Access</h2>
                  <p>Enter your password to access the secure message dashboard.</p>

                  <form onSubmit={handleLogin} className="login-form">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setLoginError('')
                      }}
                      placeholder="Admin Password"
                      className="neon-input"
                      autoFocus
                      disabled={loading}
                    />
                    <button type="submit" className="neon-button" disabled={loading} style={{ marginTop: '1rem', width: '100%' }}>
                      {loading ? 'Verifying...' : 'Login'}
                    </button>
                  </form>

                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pin-error-box"
                    >
                      <AlertTriangle size={16} />
                      <p className="pin-error-text">{loginError}</p>
                    </motion.div>
                  )}

                  <div className="login-security-note">
                    <Shield size={14} />
                    <span>JWT-secured • Rate-limited</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="admin-header">
                <h2>Message Dashboard</h2>
                <button className="logout-btn" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>

              <div className="stats-grid">
                <GlassCard delay={0} className="stat-card stat-total">
                  <Inbox size={24} />
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total Messages</div>
                </GlassCard>
                <GlassCard delay={0.1} className="stat-card stat-pending">
                  <Clock size={24} />
                  <div className="stat-value">{stats.pending}</div>
                  <div className="stat-label">Pending Replies</div>
                </GlassCard>
                <GlassCard delay={0.2} className="stat-card stat-replied">
                  <CheckCircle size={24} />
                  <div className="stat-value">{stats.replied}</div>
                  <div className="stat-label">Replied</div>
                </GlassCard>
              </div>

              <GlassCard delay={0.3} className="messages-panel">
                <div className="messages-panel-header">
                  <MessageSquare size={20} />
                  <h3>All Messages</h3>
                  <span className="messages-count">{messages.length}</span>
                </div>

                {dataLoading ? (
                  <div className="empty-state">
                    <span className="loading-dots">Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="empty-state">
                    <Inbox size={48} />
                    <p>No messages yet. Share your link!</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((msg, i) => (
                      <MessageCard
                        key={msg.id}
                        message={msg}
                        index={i}
                        isAdmin
                        onReply={handleReply}
                      />
                    ))}
                  </div>
                )}
              </GlassCard>
              <div className="dashboard-footer" style={{
                textAlign: 'center',
                marginTop: '2rem',
                color: 'rgba(255, 255, 255, 0.35)',
                fontSize: '0.85rem',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}>
                built with love by avada_kedavaraa
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}

export default Admin
