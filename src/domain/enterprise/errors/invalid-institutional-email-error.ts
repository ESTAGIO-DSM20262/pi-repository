import { DomainError } from '@/core/errors/domain-error'

export class InvalidInstitutionalEmailError extends DomainError {
  constructor(email: string) {
    super(
      `E-mail institucional inválido: "${email}". Use um e-mail @aluno.cps.sp.gov.br ou @cps.sp.gov.br.`,
    )
  }
}
