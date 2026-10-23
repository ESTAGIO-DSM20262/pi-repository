import type { UseCase } from '@/core/application/use-case'
import type {
  AuthRepository,
  PasswordResetInput,
  PasswordResetResult,
} from '@/domain/enterprise/repositories/auth-repository'

export class ResetPasswordUseCase implements UseCase<PasswordResetInput, PasswordResetResult> {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(input: PasswordResetInput): Promise<PasswordResetResult> {
    return this.authRepository.resetPassword(input)
  }
}
