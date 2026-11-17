import type { UseCase } from '@/core/application/use-case'
import { type Either, left } from '@/core/either'
import { EmailAddress } from '@/domain/enterprise/entities/email-address'
import type { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type { InvalidEmailError } from '@/domain/enterprise/errors/invalid-email-error'
import type { AccountInviteNotifier } from '@/domain/enterprise/repositories/account-invite-notifier'

export interface SendAccountInviteEmailInput {
  email: string
  name: string
  inviteUrl: string
}

export type SendAccountInviteEmailResult = Either<InvalidEmailError | EmailDeliveryError, void>

export class SendAccountInviteEmailUseCase
  implements UseCase<SendAccountInviteEmailInput, SendAccountInviteEmailResult>
{
  constructor(private readonly notifier: AccountInviteNotifier) {}

  async execute(input: SendAccountInviteEmailInput): Promise<SendAccountInviteEmailResult> {
    const emailResult = EmailAddress.create(input.email)
    if (emailResult.isLeft()) return left(emailResult.value)

    return this.notifier.notify({
      to: emailResult.value.address,
      name: input.name.trim(),
      inviteUrl: input.inviteUrl,
    })
  }
}
