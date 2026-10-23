import { type Either, right } from '@/core/either'
import type { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type {
  PasswordResetNotification,
  PasswordResetNotifier,
} from '@/domain/enterprise/repositories/password-reset-notifier'

export class ConsolePasswordResetNotifier implements PasswordResetNotifier {
  async notify({
    to,
    resetUrl,
  }: PasswordResetNotification): Promise<Either<EmailDeliveryError, void>> {
    console.info(`[password-reset] RESEND_API_KEY ausente; link para ${to}: ${resetUrl}`)
    return right(undefined)
  }
}
