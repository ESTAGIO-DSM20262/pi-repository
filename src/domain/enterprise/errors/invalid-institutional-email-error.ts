import { DomainError } from '@/core/errors/domain-error'

export class InvalidInstitutionalEmailError extends DomainError {
  constructor(email: string) {
    super(
      `E-mail institucional inválido: "${email}". Use o e-mail institucional cadastrado na instituição.`,
    )
  }
}
