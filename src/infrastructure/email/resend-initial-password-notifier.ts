import { Resend } from 'resend'
import { type Either, left, right } from '@/core/either'
import { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type {
  InitialPasswordNotification,
  InitialPasswordNotifier,
} from '@/domain/enterprise/repositories/initial-password-notifier'
import { renderInitialPasswordEmail } from './templates/render-initial-password-email'

interface ResendInitialPasswordNotifierConfig {
  apiKey: string
  from: string
}

export class ResendInitialPasswordNotifier implements InitialPasswordNotifier {
  private readonly resend: Resend
  private readonly from: string

  constructor({ apiKey, from }: ResendInitialPasswordNotifierConfig) {
    this.resend = new Resend(apiKey)
    this.from = from
  }

  async notify({
    to,
    name,
    initialPassword,
    loginUrl,
  }: InitialPasswordNotification): Promise<Either<EmailDeliveryError, void>> {
    try {
      const { subject, html, text } = await renderInitialPasswordEmail({
        name,
        initialPassword,
        loginUrl,
      })
      const { error } = await this.resend.emails.send({ from: this.from, to, subject, html, text })
      if (error) return left(new EmailDeliveryError(`Resend: ${error.message}`))
      return right(undefined)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return left(new EmailDeliveryError(`Resend: ${message}`))
    }
  }
}
