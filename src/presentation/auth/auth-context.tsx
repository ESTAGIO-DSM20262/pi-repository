'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import type { LoginCredentials } from '@/application/auth/dtos/login-credentials'
import { SignInUseCase } from '@/application/auth/sign-in'
import { SignInWithMicrosoftUseCase } from '@/application/auth/sign-in-with-microsoft'
import { SignOutUseCase } from '@/application/auth/sign-out'
import AuthActionOverlay from '@/components/ui/AuthActionOverlay'
import type { User } from '@/domain/enterprise/entities/user'
import { authClient } from '@/infrastructure/auth/auth-client'
import { BetterAuthAuthRepository } from '@/infrastructure/auth/better-auth-auth-repository'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'

const authRepository = new BetterAuthAuthRepository()
const signInUseCase = new SignInUseCase(authRepository)
const signOutUseCase = new SignOutUseCase(authRepository)
const signInWithMicrosoftUseCase = new SignInWithMicrosoftUseCase(authRepository)

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (credentials: LoginCredentials) => Promise<User>
  signInWithMicrosoft: () => Promise<void>
  signOut: () => Promise<void>
  showAuthAction: (message: string) => void
  clearAuthAction: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = authClient.useSession()
  const [authActionMessage, setAuthActionMessage] = useState<string | null>(null)
  const user = data?.user ? toDomainUser(data.user) : null
  const showAuthAction = useCallback((message: string) => setAuthActionMessage(message), [])
  const clearAuthAction = useCallback(() => setAuthActionMessage(null), [])

  async function signIn(credentials: LoginCredentials): Promise<User> {
    const result = await signInUseCase.execute(credentials)
    if (result.isLeft()) throw result.value
    return result.value.user
  }

  async function signInWithMicrosoft(): Promise<void> {
    const result = await signInWithMicrosoftUseCase.execute({
      callbackURL: '/painel',
      errorCallbackURL: '/login',
    })
    if (result.isLeft()) throw result.value
  }

  async function signOut(): Promise<void> {
    await signOutUseCase.execute()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isPending,
        signIn,
        signInWithMicrosoft,
        signOut,
        showAuthAction,
        clearAuthAction,
      }}
    >
      {children}
      <AuthActionOverlay message={authActionMessage} />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
