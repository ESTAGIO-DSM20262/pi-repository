import type { UseCase } from '@/core/application/use-case'
import type { Either } from '@/core/either'
import type { AuthenticationError } from '@/domain/enterprise/errors/authentication-error'
import type {
  AuthRepository,
  MicrosoftSignInInput,
} from '@/domain/enterprise/repositories/auth-repository'

export class SignInWithMicrosoftUseCase
  implements UseCase<MicrosoftSignInInput, Either<AuthenticationError, void>>
{
  constructor(private readonly authRepository: AuthRepository) {}

  execute(input: MicrosoftSignInInput): Promise<Either<AuthenticationError, void>> {
    return this.authRepository.signInWithMicrosoft(input)
  }
}
