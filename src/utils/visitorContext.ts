import { createContext, useContext } from 'react'

export interface VisitorContextType {
  username: string | null
  isLoading: boolean
  startSession: (username: string, password: string) => Promise<void>
  logoutSession: () => Promise<void>
}

export const VisitorContext = createContext<VisitorContextType>({
  username: null,
  isLoading: true,
  startSession: async () => {},
  logoutSession: async () => {},
})

export function useVisitor() {
  return useContext(VisitorContext)
}
