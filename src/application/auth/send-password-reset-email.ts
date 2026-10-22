import type { UseCase } from '@/core/application/use-case'
import { type Either, left, right } from '@/core/either'
import { EmailAddress } from '@/domain/enterprise/entities/email-address'
import type { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type { InvalidEmailError } from '@/domain/enterprise/errors/invalid-email-error'
import type { PasswordResetNotifier } from '@/domain/enterprise/repositories/password-reset-notifier'

export interface SendPasswordResetEmailInput {
  email: string
  name: string
  active: boolean
  resetUrl: string
}

export type SendPasswordResetEmailResult = Either<InvalidEmailError | EmailDeliveryError, void>

export class SendPasswordResetEmailUseCase
  implements UseCase<SendPasswordResetEmailInput, SendPasswordResetEmailResult>
{
  constructor(private readonly notifier: PasswordResetNotifier) {}

  async execute(input: SendPasswordResetEmailInput): Promise<SendPasswordResetEmailResult> {
    if (!input.active) return right(undefined)

    const emailResult = EmailAddress.create(input.email)
    if (emailResult.isLeft()) return left(emailResult.value)

    return this.notifier.notify({
      to: emailResult.value.address,
      name: input.name.trim(),
      resetUrl: input.resetUrl,
    })
  }
}
