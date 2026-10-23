import { type Either, left, right } from '@/core/either'
import { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type {
  PasswordResetNotification,
  PasswordResetNotifier,
} from '@/domain/enterprise/repositories/password-reset-notifier'

export class InMemoryPasswordResetNotifier implements PasswordResetNotifier {
  notifications: PasswordResetNotification[] = []
  shouldFail = false

  async notify(notification: PasswordResetNotification): Promise<Either<EmailDeliveryError, void>> {
    if (this.shouldFail) return left(new EmailDeliveryError())
    this.notifications.push(notification)
    return right(undefined)
  }
}
