import { useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import { VisitorContext } from './visitorContext'

const VISITOR_USERNAME_KEY = 'whisperbox_visitor_username'

export function VisitorProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem(VISITOR_USERNAME_KEY)
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function verifyVisitor() {
      try {
        const data = (await api.getVisitorSession()) as { username?: string }
        if (!mounted) return

        if (data.username) {
          localStorage.setItem(VISITOR_USERNAME_KEY, data.username)
          setUsername(data.username)
        } else {
          localStorage.removeItem(VISITOR_USERNAME_KEY)
          setUsername(null)
        }
      } catch {
        if (mounted) {
          localStorage.removeItem(VISITOR_USERNAME_KEY)
          setUsername(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    verifyVisitor()

    return () => {
      mounted = false
    }
  }, [])

  const startSession = async (newUsername: string, password: string) => {
    const data = (await api.startVisitorSession(newUsername, password)) as { username: string }
    localStorage.setItem(VISITOR_USERNAME_KEY, data.username)
    setUsername(data.username)
  }

  const logoutSession = async () => {
    await api.logoutVisitorSession().catch(() => {})
    localStorage.removeItem(VISITOR_USERNAME_KEY)
    setUsername(null)
  }

  return (
    <VisitorContext.Provider value={{ username, isLoading, startSession, logoutSession }}>
      {children}
    </VisitorContext.Provider>
  )
}
