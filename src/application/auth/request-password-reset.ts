import type { UseCase } from '@/core/application/use-case'
import type {
  AuthRepository,
  PasswordResetRequest,
  PasswordResetRequestResult,
} from '@/domain/enterprise/repositories/auth-repository'

export class RequestPasswordResetUseCase
  implements UseCase<PasswordResetRequest, PasswordResetRequestResult>
{
  constructor(private readonly authRepository: AuthRepository) {}

  execute(request: PasswordResetRequest): Promise<PasswordResetRequestResult> {
    return this.authRepository.requestPasswordReset({
      email: request.email.trim().toLowerCase(),
      redirectTo: request.redirectTo,
    })
  }
}
