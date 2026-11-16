import { type Either, right } from '@/core/either'
import type { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import type {
  InitialPasswordNotification,
  InitialPasswordNotifier,
} from '@/domain/enterprise/repositories/initial-password-notifier'

export class ConsoleInitialPasswordNotifier implements InitialPasswordNotifier {
  async notify({
    to,
    initialPassword,
    loginUrl,
  }: InitialPasswordNotification): Promise<Either<EmailDeliveryError, void>> {
    console.info(
      `[initial-password] RESEND_API_KEY ausente (somente desenvolvimento); senha inicial de ${to}: ${initialPassword} — acesso em ${loginUrl}`,
    )
    return right(undefined)
  }
}
