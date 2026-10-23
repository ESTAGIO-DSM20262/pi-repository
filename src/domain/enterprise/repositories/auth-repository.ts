import type { Either } from '@/core/either'
import type { User } from '../entities/user'
import type { AuthenticationError } from '../errors/authentication-error'
import type { InvalidCredentialsError } from '../errors/invalid-credentials-error'
import type { InvalidResetTokenError } from '../errors/invalid-reset-token-error'

export interface SignInCredentials {
  email: string
  password: string
}

export interface MicrosoftSignInInput {
  callbackURL: string
  errorCallbackURL: string
}

export interface PasswordResetRequest {
  email: string
  redirectTo: string
}

export interface PasswordResetInput {
  token: string
  newPassword: string
}

export type EmailSignInResult = Either<InvalidCredentialsError, { user: User }>

export type PasswordResetRequestResult = Either<AuthenticationError, void>

export type PasswordResetResult = Either<InvalidResetTokenError | AuthenticationError, void>

export interface AuthRepository {
  signInWithEmail(credentials: SignInCredentials): Promise<EmailSignInResult>
  signInWithMicrosoft(input: MicrosoftSignInInput): Promise<Either<AuthenticationError, void>>
  signOut(): Promise<void>
  requestPasswordReset(request: PasswordResetRequest): Promise<PasswordResetRequestResult>
  resetPassword(input: PasswordResetInput): Promise<PasswordResetResult>
}
