// Regras de e-mail institucional do Centro Paula Souza.
//
// - Alunos:      nome.sobrenome@aluno.cps.sp.gov.br
// - Professores: nome.sobrenome@cps.sp.gov.br
//
// O vínculo (papel) é derivado exclusivamente do domínio do e-mail.

export type Role = 'aluno' | 'professor'

const STUDENT_DOMAIN = 'aluno.cps.sp.gov.br'
const PROFESSOR_DOMAIN = 'cps.sp.gov.br'

// Correspondência exata de domínio para evitar a ambiguidade de sufixo entre
// `aluno.cps.sp.gov.br` e `cps.sp.gov.br`.
const DOMAIN_ROLE: Record<string, Role> = {
  [STUDENT_DOMAIN]: 'aluno',
  [PROFESSOR_DOMAIN]: 'professor',
}

/** Retorna o papel correspondente ao e-mail, ou `null` se o domínio for inválido. */
export function roleFromEmail(email: string): Role | null {
  const normalized = email.trim().toLowerCase()
  const atIndex = normalized.lastIndexOf('@')
  if (atIndex === -1) return null

  const domain = normalized.slice(atIndex + 1)
  return DOMAIN_ROLE[domain] ?? null
}

/** `true` quando o e-mail pertence a um dos domínios institucionais permitidos. */
export function isAllowedInstitutionalEmail(email: string): boolean {
  return roleFromEmail(email) !== null
}

export const ROLE_LABEL: Record<Role, string> = {
  aluno: 'Aluno',
  professor: 'Professor',
}

/** Normaliza um `role` vindo da sessão para o tipo `Role`. */
export function normalizeRole(value: unknown): Role {
  return value === 'professor' ? 'professor' : 'aluno'
}
