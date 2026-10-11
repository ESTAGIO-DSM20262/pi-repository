'use client'

import { type Either, left, right } from '@/core/either'
import type { User } from '@/domain/enterprise/entities/user'
import { AuthenticationError } from '@/domain/enterprise/errors/authentication-error'
import { InvalidCredentialsError } from '@/domain/enterprise/errors/invalid-credentials-error'
import type {
  AuthRepository,
  EmailSignInResult,
  MicrosoftSignInInput,
  SignInCredentials,
} from '@/domain/enterprise/repositories/auth-repository'
import { authClient } from './auth-client'
import { type BetterAuthUser, toDomainUser } from './better-auth-user-mapper'

// O better-auth devolve mensagens em inglês; normalizamos para o texto exibido.
function toInvalidCredentials(message?: string): InvalidCredentialsError {
  if (message?.toLowerCase().includes('invalid email or password')) {
    return new InvalidCredentialsError()
  }
  return new InvalidCredentialsError(message)
}

export class BetterAuthAuthRepository implements AuthRepository {
  async signInWithEmail({ email, password }: SignInCredentials): Promise<EmailSignInResult> {
    const { data, error } = await authClient.signIn.email({ email, password })

    if (error || !data?.user) {
      return left(toInvalidCredentials(error?.message))
    }

    const user: User | null = toDomainUser(data.user as BetterAuthUser)
    if (!user) {
      return left(toInvalidCredentials())
    }

    return right({ user })
  }

  async signInWithMicrosoft({
    callbackURL,
    errorCallbackURL,
  }: MicrosoftSignInInput): Promise<Either<AuthenticationError, void>> {
    const { error } = await authClient.signIn.social({
      provider: 'microsoft',
      callbackURL,
      errorCallbackURL,
    })

    if (error) {
      return left(new AuthenticationError(error.message))
    }

    return right(undefined)
  }

  async signOut(): Promise<void> {
    await authClient.signOut()
  }
}
