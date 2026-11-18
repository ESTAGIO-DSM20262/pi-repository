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
  retryDelayMs?: number
}

const MAX_SEND_ATTEMPTS = 3
const DEFAULT_RETRY_DELAY_MS = 1000

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class ResendAccountInviteNotifier implements AccountInviteNotifier {
  private readonly resend: Resend
  private readonly from: string
  private readonly retryDelayMs: number

  constructor({
    apiKey,
    from,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  }: ResendAccountInviteNotifierConfig) {
    this.resend = new Resend(apiKey)
    this.from = from
    this.retryDelayMs = retryDelayMs
  }

  async notify({
    to,
    name,
    inviteUrl,
  }: AccountInviteNotification): Promise<Either<EmailDeliveryError, void>> {
    try {
      const { subject, html, text } = await renderAccountInviteEmail({ name, inviteUrl })
      for (let attempt = 1; ; attempt++) {
        const { error } = await this.resend.emails.send({
          from: this.from,
          to,
          subject,
          html,
          text,
        })
        if (!error) return right(undefined)
        if (error.name !== 'rate_limit_exceeded' || attempt >= MAX_SEND_ATTEMPTS)
          return left(new EmailDeliveryError(`Resend: ${error.message}`))
        await wait(this.retryDelayMs * attempt)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return left(new EmailDeliveryError(`Resend: ${message}`))
    }
  }
}
