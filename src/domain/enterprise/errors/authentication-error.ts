import { DomainError } from '@/core/errors/domain-error'

export class AuthenticationError extends DomainError {
  constructor(message = 'Não foi possível concluir a autenticação. Tente novamente.') {
    super(message)
  }
}
