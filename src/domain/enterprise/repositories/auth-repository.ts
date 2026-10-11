import type { Either } from '@/core/either'
import type { User } from '../entities/user'
import type { AuthenticationError } from '../errors/authentication-error'
import type { InvalidCredentialsError } from '../errors/invalid-credentials-error'

export interface SignInCredentials {
  email: string
  password: string
}

export interface MicrosoftSignInInput {
  callbackURL: string
  errorCallbackURL: string
}

export type EmailSignInResult = Either<InvalidCredentialsError, { user: User }>

/**
 * Porta (interface) do gateway de autenticação. O domínio/aplicação dependem
 * desta abstração; a implementação concreta (better-auth) vive na
 * infraestrutura.
 */
export interface AuthRepository {
  signInWithEmail(credentials: SignInCredentials): Promise<EmailSignInResult>
  signInWithMicrosoft(input: MicrosoftSignInInput): Promise<Either<AuthenticationError, void>>
  signOut(): Promise<void>
}
