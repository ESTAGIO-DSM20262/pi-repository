import type { Either } from '@/core/either'
import type { EmailDeliveryError } from '../errors/email-delivery-error'

export interface AccountInviteNotification {
  to: string
  name: string
  inviteUrl: string
}

export interface AccountInviteNotifier {
  notify(notification: AccountInviteNotification): Promise<Either<EmailDeliveryError, void>>
}
