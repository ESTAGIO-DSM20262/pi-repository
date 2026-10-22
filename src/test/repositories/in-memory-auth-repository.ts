import { type Either, left, right } from '@/core/either'
import { User } from '@/domain/enterprise/entities/user'
import { AuthenticationError } from '@/domain/enterprise/errors/authentication-error'
import { InvalidCredentialsError } from '@/domain/enterprise/errors/invalid-credentials-error'
import { InvalidResetTokenError } from '@/domain/enterprise/errors/invalid-reset-token-error'
import type {
  AuthRepository,
  EmailSignInResult,
  PasswordResetInput,
  PasswordResetRequest,
  PasswordResetRequestResult,
  PasswordResetResult,
  SignInCredentials,
} from '@/domain/enterprise/repositories/auth-repository'

function makeUser(): User {
  const result = User.create({ name: 'João', email: 'joao.silva@aluno.cps.sp.gov.br' }, 'user-1')
  if (result.isLeft()) throw new Error('setup inválido')
  return result.value
}

export class InMemoryAuthRepository implements AuthRepository {
  lastCredentials: SignInCredentials | null = null
  lastResetRequest: PasswordResetRequest | null = null
  lastResetInput: PasswordResetInput | null = null
  validResetTokens = new Set<string>()
  shouldFail = false

  async signInWithEmail(credentials: SignInCredentials): Promise<EmailSignInResult> {
    this.lastCredentials = credentials
    if (this.shouldFail) return left(new InvalidCredentialsError())
    return right({ user: makeUser() })
  }

  async signInWithMicrosoft(): Promise<Either<AuthenticationError, void>> {
    return right<AuthenticationError, void>(undefined)
  }

  async signOut() {}

  async requestPasswordReset(request: PasswordResetRequest): Promise<PasswordResetRequestResult> {
    this.lastResetRequest = request
    if (this.shouldFail) return left(new AuthenticationError())
    return right(undefined)
  }

  async resetPassword(input: PasswordResetInput): Promise<PasswordResetResult> {
    this.lastResetInput = input
    if (!this.validResetTokens.has(input.token)) return left(new InvalidResetTokenError())
    this.validResetTokens.delete(input.token)
    return right(undefined)
  }
}
