import { left } from '@/core/either'
import { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type { PasswordResetNotifier } from '@/domain/enterprise/repositories/password-reset-notifier'
import { ConsolePasswordResetNotifier } from './console-password-reset-notifier'
import { ResendPasswordResetNotifier } from './resend-password-reset-notifier'

const unconfiguredNotifier: PasswordResetNotifier = {
  async notify() {
    return left(new EmailDeliveryError('RESEND_API_KEY and EMAIL_FROM must be set'))
  },
}

export function makePasswordResetNotifier(): PasswordResetNotifier {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (apiKey && from) return new ResendPasswordResetNotifier({ apiKey, from })
  if (process.env.NODE_ENV === 'production') return unconfiguredNotifier
  return new ConsolePasswordResetNotifier()
}
