import type { UseCase } from '@/core/application/use-case'
import type {
  AuthRepository,
  EmailSignInResult,
  SignInCredentials,
} from '@/domain/enterprise/repositories/auth-repository'

export class SignInUseCase implements UseCase<SignInCredentials, EmailSignInResult> {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(credentials: SignInCredentials): Promise<EmailSignInResult> {
    return this.authRepository.signInWithEmail({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    })
  }
}
