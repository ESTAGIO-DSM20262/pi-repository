'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '@/services/auth.service'
import type { LoginCredentials, User } from '@/types/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (credentials: LoginCredentials) => Promise<User>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(authService.getStoredUser())
    setLoading(false)
  }, [])

  async function signIn(credentials: LoginCredentials) {
    const loggedUser = await authService.login(credentials)
    setUser(loggedUser)
    return loggedUser
  }

  function signOut() {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}