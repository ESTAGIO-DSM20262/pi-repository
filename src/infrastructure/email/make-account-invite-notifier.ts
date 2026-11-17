import { left } from '@/core/either'
import { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type { AccountInviteNotifier } from '@/domain/enterprise/repositories/account-invite-notifier'
import { ConsoleAccountInviteNotifier } from './console-account-invite-notifier'
import { ResendAccountInviteNotifier } from './resend-account-invite-notifier'

const unconfiguredNotifier: AccountInviteNotifier = {
  async notify() {
    return left(new EmailDeliveryError('RESEND_API_KEY and EMAIL_FROM must be set'))
  },
}

export function makeAccountInviteNotifier(): AccountInviteNotifier {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (apiKey && from) return new ResendAccountInviteNotifier({ apiKey, from })
  if (process.env.NODE_ENV === 'production') return unconfiguredNotifier
  return new ConsoleAccountInviteNotifier()
}
