import { type Either, left, right } from '@/core/either'
import { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type {
  InitialPasswordNotification,
  InitialPasswordNotifier,
} from '@/domain/enterprise/repositories/initial-password-notifier'

export class InMemoryInitialPasswordNotifier implements InitialPasswordNotifier {
  notifications: InitialPasswordNotification[] = []
  shouldFail = false

  async notify(
    notification: InitialPasswordNotification,
  ): Promise<Either<EmailDeliveryError, void>> {
    if (this.shouldFail) return left(new EmailDeliveryError())
    this.notifications.push(notification)
    return right(undefined)
  }
}
