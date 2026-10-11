import type { UseCase } from '@/core/application/use-case'
import type { AuthRepository } from '@/domain/enterprise/repositories/auth-repository'

export class SignOutUseCase implements UseCase<void, void> {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepository.signOut()
  }
}
