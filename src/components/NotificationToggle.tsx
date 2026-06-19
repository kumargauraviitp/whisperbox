import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { subscribeToPush } from '../utils/push'

export default function NotificationToggle() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const handleEnable = async () => {
    setLoading(true)
    try {
      const success = await subscribeToPush()
      if (success) {
        setPermission('granted')
        alert('Push notifications enabled successfully!')
      } else {
        setPermission(Notification.permission)
        if (Notification.permission === 'denied') {
          alert('Notifications are blocked. Please enable them in your browser settings.')
        } else {
          alert('Failed to enable push notifications. Make sure your browser supports them.')
        }
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while enabling notifications.')
    } finally {
      setLoading(false)
    }
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null
  }

  if (permission === 'granted') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00ff88', fontSize: '0.85rem' }}>
        <Bell size={16} />
        <span>Notifications Enabled</span>
      </div>
    )
  }

  return (
    <button 
      onClick={handleEnable} 
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '9999px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '0.85rem',
        transition: 'all 0.2s',
      }}
    >
      <BellOff size={16} />
      <span>{loading ? 'Enabling...' : 'Enable Notifications'}</span>
    </button>
  )
}
