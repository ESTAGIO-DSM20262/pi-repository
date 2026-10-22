import { DomainError } from '@/core/errors/domain-error'

export class InvalidResetTokenError extends DomainError {
  constructor(message = 'O link de redefinição é inválido ou expirou. Solicite um novo.') {
    super(message)
  }
}
