import { Resend } from 'resend'
import { type Either, left, right } from '@/core/either'
import { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type {
  PasswordResetNotification,
  PasswordResetNotifier,
} from '@/domain/enterprise/repositories/password-reset-notifier'
import { renderPasswordResetEmail } from './templates/render-password-reset-email'

interface ResendPasswordResetNotifierConfig {
  apiKey: string
  from: string
}

export class ResendPasswordResetNotifier implements PasswordResetNotifier {
  private readonly resend: Resend
  private readonly from: string

  constructor({ apiKey, from }: ResendPasswordResetNotifierConfig) {
    this.resend = new Resend(apiKey)
    this.from = from
  }

  async notify({
    to,
    name,
    resetUrl,
  }: PasswordResetNotification): Promise<Either<EmailDeliveryError, void>> {
    try {
      const { subject, html, text } = await renderPasswordResetEmail({ name, resetUrl })
      const { error } = await this.resend.emails.send({ from: this.from, to, subject, html, text })
      if (error) return left(new EmailDeliveryError(`Resend: ${error.message}`))
      return right(undefined)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return left(new EmailDeliveryError(`Resend: ${message}`))
    }
  }
}
