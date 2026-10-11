import { type Either, left, right } from '@/core/either'
import { ValueObject } from '@/core/entities/value-object'
import { InvalidInstitutionalEmailError } from '../errors/invalid-institutional-email-error'
import type { Role } from './role'

interface InstitutionalEmailProps {
  address: string
  role: Role
}

// Regras de e-mail institucional do Centro Paula Souza.
//
// - Alunos:      nome.sobrenome@aluno.cps.sp.gov.br
// - Professores: nome.sobrenome@cps.sp.gov.br
//
// O vínculo (papel) é derivado exclusivamente do domínio do e-mail. Esta é a
// fonte única dessa regra, compartilhada entre o cliente e o servidor.
const STUDENT_DOMAIN = 'aluno.cps.sp.gov.br'
const PROFESSOR_DOMAIN = 'cps.sp.gov.br'

// Correspondência exata de domínio para evitar a ambiguidade de sufixo entre
// `aluno.cps.sp.gov.br` e `cps.sp.gov.br`.
const DOMAIN_ROLE: Record<string, Role> = {
  [STUDENT_DOMAIN]: 'student',
  [PROFESSOR_DOMAIN]: 'professor',
}

/**
 * Value object que representa um e-mail institucional válido e o papel dele
 * derivado. Construído sempre via `create`, que devolve `Either`.
 */
export class InstitutionalEmail extends ValueObject<InstitutionalEmailProps> {
  private constructor(props: InstitutionalEmailProps) {
    super(props)
  }

  get address() {
    return this.props.address
  }

  get role() {
    return this.props.role
  }

  equals(other: InstitutionalEmail) {
    return this.address === other.address
  }

  static create(raw: string): Either<InvalidInstitutionalEmailError, InstitutionalEmail> {
    const normalized = (raw ?? '').trim().toLowerCase()
    const atIndex = normalized.lastIndexOf('@')

    if (atIndex <= 0 || atIndex === normalized.length - 1) {
      return left(new InvalidInstitutionalEmailError(raw))
    }

    const domain = normalized.slice(atIndex + 1)
    const role = DOMAIN_ROLE[domain]

    if (!role) {
      return left(new InvalidInstitutionalEmailError(raw))
    }

    return right(new InstitutionalEmail({ address: normalized, role }))
  }

  /** Atalho booleano para validações de formulário. */
  static isValid(raw: string): boolean {
    return InstitutionalEmail.create(raw).isRight()
  }
}
