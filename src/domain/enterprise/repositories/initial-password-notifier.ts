import type { Either } from '@/core/either'
import type { EmailDeliveryError } from '../errors/email-delivery-error'

export interface InitialPasswordNotification {
  to: string
  name: string
  initialPassword: string
  loginUrl: string
}

export interface InitialPasswordNotifier {
  notify(notification: InitialPasswordNotification): Promise<Either<EmailDeliveryError, void>>
}
