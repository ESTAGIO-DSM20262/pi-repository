import { type Either, left, right } from '@/core/either'
import { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type {
  AccountInviteNotification,
  AccountInviteNotifier,
} from '@/domain/enterprise/repositories/account-invite-notifier'

export class InMemoryAccountInviteNotifier implements AccountInviteNotifier {
  notifications: AccountInviteNotification[] = []
  shouldFail = false

  async notify(
    notification: AccountInviteNotification,
  ): Promise<Either<EmailDeliveryError, void>> {
    if (this.shouldFail) return left(new EmailDeliveryError())
    this.notifications.push(notification)
    return right(undefined)
  }
}
