import { left } from '@/core/either'
import { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type { InitialPasswordNotifier } from '@/domain/enterprise/repositories/initial-password-notifier'
import { ConsoleInitialPasswordNotifier } from './console-initial-password-notifier'
import { ResendInitialPasswordNotifier } from './resend-initial-password-notifier'

const unconfiguredNotifier: InitialPasswordNotifier = {
  async notify() {
    return left(new EmailDeliveryError('RESEND_API_KEY and EMAIL_FROM must be set'))
  },
}

export function makeInitialPasswordNotifier(): InitialPasswordNotifier {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (apiKey && from) return new ResendInitialPasswordNotifier({ apiKey, from })
  if (process.env.NODE_ENV === 'production') return unconfiguredNotifier
  return new ConsoleInitialPasswordNotifier()
}
