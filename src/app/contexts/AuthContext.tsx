'use client'

import { createContext, useContext } from 'react'
import { authClient } from '@/libs/auth-client'
import { normalizeRole } from '@/libs/institutional-email'
import type { LoginCredentials, User } from '@/types/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (credentials: LoginCredentials) => Promise<User>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toUser(sessionUser: {
  id: string
  name: string
  email: string
  role?: string | null
}): User {
  return {
    id: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    role: normalizeRole(sessionUser.role),
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = authClient.useSession()
  const user = data?.user ? toUser(data.user) : null

  async function signIn(credentials: LoginCredentials) {
    const { data: result, error } = await authClient.signIn.email({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    })

    if (error || !result?.user) {
      throw new Error(error?.message ?? 'E-mail ou senha incorretos.')
    }

    return toUser(result.user)
  }

  async function signOut() {
    await authClient.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading: isPending, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
