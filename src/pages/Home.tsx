import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, MessageCircle, Send, Shield, Sparkles } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import PageTransition from '../components/PageTransition'
import NotificationToggle from '../components/NotificationToggle'
import { useVisitor } from '../utils/visitorContext'

function Home() {
  const navigate = useNavigate()
  const { username, logoutSession } = useVisitor()

  return (
    <PageTransition>
      <div className="home-container">
        <div className="home-content">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="home-hero"
          >
            <div className="home-badge">
              <Sparkles size={16} />
              <span>Anonymous & Password Protected</span>
            </div>
            <h1 className="home-title">
              Say what you can't
              <br />
              <span className="gradient-text">say aloud</span>
            </h1>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(255, 0, 160, 0.06)',
                border: '1px solid rgba(255, 0, 160, 0.18)',
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginTop: '0.75rem',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(255, 0, 160, 0.08)',
                transition: 'box-shadow 0.3s ease',
              }}
            >
              <span>built with</span>
              <motion.span
                animate={{ scale: [1, 1.25, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: 'easeInOut'
                }}
                style={{ display: 'inline-block' }}
              >
                ❤️
              </motion.span>
              <span>by</span>
              <span className="mono-text" style={{
                background: 'linear-gradient(135deg, #00f2ff 0%, #00ff88 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700
              }}>
                avada_kedavaraa
              </span>
            </motion.div>
            <p className="home-subtitle">
              Signed in privately as <span className="mono-text">{username}</span>.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <NotificationToggle />
            </div>
          </motion.div>

          <div className="home-cards">
            <GlassCard delay={0.2}>
              <div className="action-card" onClick={() => navigate('/send')}>
                <div className="action-icon action-icon-cyan">
                  <Send size={32} />
                </div>
                <h3>Send a Message</h3>
                <p>Drop a private message for the owner under your reserved username.</p>
                <NeonButton color="cyan" className="action-btn">
                  Start Messaging
                </NeonButton>
              </div>
            </GlassCard>

            <GlassCard delay={0.3}>
              <div className="action-card" onClick={() => navigate('/replies')}>
                <div className="action-icon action-icon-magenta">
                  <MessageCircle size={32} />
                </div>
                <h3>Check Replies</h3>
                <p>Use your password each time to unlock replies from the owner.</p>
                <NeonButton color="magenta" className="action-btn">
                  View Replies
                </NeonButton>
              </div>
            </GlassCard>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="home-footer"
          >
            <div className="home-trust">
              <Shield size={14} />
              <span>Your password is hashed on the server.</span>
            </div>
            <div className="home-footer-actions">
              <button className="owner-link" onClick={() => navigate('/admin')}>
                Owner Login
              </button>
              <button className="owner-link" onClick={() => void logoutSession()}>
                <LogOut size={13} />
                <span>Forget this device</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}

export default Home
