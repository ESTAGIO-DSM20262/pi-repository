import { Resend } from 'resend'
import { type Either, left, right } from '@/core/either'
import { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type {
  AccountInviteNotification,
  AccountInviteNotifier,
} from '@/domain/enterprise/repositories/account-invite-notifier'
import { renderAccountInviteEmail } from './templates/render-account-invite-email'

interface ResendAccountInviteNotifierConfig {
  apiKey: string
  from: string
}

export class ResendAccountInviteNotifier implements AccountInviteNotifier {
  private readonly resend: Resend
  private readonly from: string

  constructor({ apiKey, from }: ResendAccountInviteNotifierConfig) {
    this.resend = new Resend(apiKey)
    this.from = from
  }

  async notify({
    to,
    name,
    inviteUrl,
  }: AccountInviteNotification): Promise<Either<EmailDeliveryError, void>> {
    try {
      const { subject, html, text } = await renderAccountInviteEmail({ name, inviteUrl })
      const { error } = await this.resend.emails.send({ from: this.from, to, subject, html, text })
      if (error) return left(new EmailDeliveryError(`Resend: ${error.message}`))
      return right(undefined)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return left(new EmailDeliveryError(`Resend: ${message}`))
    }
  }
}
