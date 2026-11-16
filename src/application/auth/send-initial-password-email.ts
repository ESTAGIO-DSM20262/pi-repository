import type { UseCase } from '@/core/application/use-case'
import { type Either, left } from '@/core/either'
import { EmailAddress } from '@/domain/enterprise/entities/email-address'
import type { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type { InvalidEmailError } from '@/domain/enterprise/errors/invalid-email-error'
import type { InitialPasswordNotifier } from '@/domain/enterprise/repositories/initial-password-notifier'

export interface SendInitialPasswordEmailInput {
  email: string
  name: string
  initialPassword: string
  loginUrl: string
}

export type SendInitialPasswordEmailResult = Either<InvalidEmailError | EmailDeliveryError, void>

export class SendInitialPasswordEmailUseCase
  implements UseCase<SendInitialPasswordEmailInput, SendInitialPasswordEmailResult>
{
  constructor(private readonly notifier: InitialPasswordNotifier) {}

  async execute(input: SendInitialPasswordEmailInput): Promise<SendInitialPasswordEmailResult> {
    const emailResult = EmailAddress.create(input.email)
    if (emailResult.isLeft()) return left(emailResult.value)

    return this.notifier.notify({
      to: emailResult.value.address,
      name: input.name.trim(),
      initialPassword: input.initialPassword,
      loginUrl: input.loginUrl,
    })
  }
}
