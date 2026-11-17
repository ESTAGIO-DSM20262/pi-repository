import { type Either, right } from '@/core/either'
import type { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type {
  AccountInviteNotification,
  AccountInviteNotifier,
} from '@/domain/enterprise/repositories/account-invite-notifier'

export class ConsoleAccountInviteNotifier implements AccountInviteNotifier {
  async notify({
    to,
    inviteUrl,
  }: AccountInviteNotification): Promise<Either<EmailDeliveryError, void>> {
    console.info(
      `[account-invite] RESEND_API_KEY ausente (somente desenvolvimento); convite para ${to}: ${inviteUrl}`,
    )
    return right(undefined)
  }
}
