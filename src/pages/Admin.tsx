import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Lock, Inbox, MessageSquare, CheckCircle, Clock, LogOut, Shield,
  AlertTriangle, ChevronDown, ChevronRight, User,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import PageTransition from '../components/PageTransition'
import MessageCard from '../components/MessageCard'
import NotificationToggle from '../components/NotificationToggle'
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

// localStorage key tracking which messages the admin has already seen.
const SEEN_KEY = 'whisperbox_seen_messages'

function readSeenIds(): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'))
  } catch {
    return new Set<string>()
  }
}

function writeSeenIds(ids: Set<string>) {
  // Keep the set bounded — only the most recent 500 ids.
  const arr = Array.from(ids).slice(-500)
  localStorage.setItem(SEEN_KEY, JSON.stringify(arr))
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
  const [seenIds, setSeenIds] = useState<Set<string>>(() => readSeenIds())
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

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

  // Mark messages as seen once the admin actually expands a group or loads data.
  const markGroupSeen = useCallback((username: string, groupMessages: Message[]) => {
    setSeenIds((prev) => {
      const next = new Set(prev)
      let changed = false
      for (const m of groupMessages) {
        if (!next.has(m.id)) {
          next.add(m.id)
          changed = true
        }
      }
      if (changed) {
        writeSeenIds(next)
        // Auto-collapse the dot once seen.
        console.log(`Marked ${username} messages as seen`)
      }
      return next
    })
  }, [])

  // Group messages by username (most recent activity first).
  const grouped = useMemo(() => {
    const map = new Map<string, Message[]>()
    for (const m of messages) {
      const list = map.get(m.senderUsername) || []
      list.push(m)
      map.set(m.senderUsername, list)
    }
    // Sort each group's messages newest-first.
    for (const list of map.values()) {
      list.sort((a, b) => b.createdAt - a.createdAt)
    }
    // Sort groups by newest message timestamp.
    return Array.from(map.entries()).sort(
      (a, b) => b[1][0].createdAt - a[1][0].createdAt
    )
  }, [messages])

  // Count of unseen (new) messages per username for the dot indicator.
  const unseenCount = useCallback(
    (username: string) => {
      const list = grouped.find(([u]) => u === username)?.[1] || []
      return list.filter((m) => !seenIds.has(m.id)).length
    },
    [grouped, seenIds]
  )

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

  const handleDelete = async (id: string) => {
    try {
      await api.adminDeleteMessage(id)
      // Optimistically remove locally so the UI updates instantly.
      setMessages((prev) => prev.filter((m) => m.id !== id))
      setSeenIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        writeSeenIds(next)
        return next
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert('Failed to delete message: ' + message)
    }
  }

  const toggleGroup = (username: string, groupMessages: Message[]) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(username)) {
        next.delete(username)
      } else {
        next.add(username)
        // Mark all messages in this group as seen the moment it's expanded.
        markGroupSeen(username, groupMessages)
      }
      return next
    })
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
                <div className="admin-header-actions">
                  <NotificationToggle />
                  <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
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
                  <h3>Conversations</h3>
                  <span className="messages-count">{grouped.length}</span>
                </div>

                {dataLoading ? (
                  <div className="empty-state">
                    <span className="loading-dots">Loading messages...</span>
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="empty-state">
                    <Inbox size={48} />
                    <p>No messages yet. Share your link!</p>
                  </div>
                ) : (
                  <div className="conversations-list">
                    {grouped.map(([username, groupMessages], i) => {
                      const isOpen = openGroups.has(username)
                      const newCount = unseenCount(username)
                      const pendingCount = groupMessages.filter((m) => !m.reply).length
                      const lastTime = new Date(groupMessages[0].createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })
                      return (
                        <motion.div
                          key={username}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="conversation-group"
                        >
                          <button
                            className="conversation-header"
                            onClick={() => toggleGroup(username, groupMessages)}
                          >
                            <div className="conversation-user">
                              {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                              <User size={16} />
                              <span className="mono-text">{username}</span>
                              {newCount > 0 && (
                                <span className="new-dot" title={`${newCount} new message${newCount > 1 ? 's' : ''}`} />
                              )}
                            </div>
                            <div className="conversation-meta">
                              {pendingCount > 0 && (
                                <span className="conversation-pending">{pendingCount} pending</span>
                              )}
                              <span className="conversation-time">{lastTime}</span>
                              <span className="conversation-count">{groupMessages.length}</span>
                            </div>
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="conversation-messages"
                              >
                                {groupMessages.map((msg, mi) => (
                                  <MessageCard
                                    key={msg.id}
                                    message={msg}
                                    index={mi}
                                    isAdmin
                                    onReply={handleReply}
                                    onDelete={handleDelete}
                                  />
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
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
