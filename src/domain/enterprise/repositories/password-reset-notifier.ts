import type { Either } from '@/core/either'
import type { EmailDeliveryError } from '../errors/email-delivery-error'

export interface PasswordResetNotification {
  to: string
  name: string
  resetUrl: string
}

export interface PasswordResetNotifier {
  notify(notification: PasswordResetNotification): Promise<Either<EmailDeliveryError, void>>
}
