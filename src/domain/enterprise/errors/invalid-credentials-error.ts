import { DomainError } from '@/core/errors/domain-error'

export class InvalidCredentialsError extends DomainError {
  constructor(message = 'E-mail ou senha incorretos.') {
    super(message)
  }
}
