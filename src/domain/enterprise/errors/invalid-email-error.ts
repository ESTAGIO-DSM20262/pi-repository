import { DomainError } from '@/core/errors/domain-error'

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`E-mail inválido: "${email}".`)
  }
}
