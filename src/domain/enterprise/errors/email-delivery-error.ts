import { DomainError } from '@/core/errors/domain-error'

export class EmailDeliveryError extends DomainError {
  constructor(message = 'Não foi possível enviar o e-mail. Tente novamente.') {
    super(message)
  }
}
