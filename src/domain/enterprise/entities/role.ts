/**
 * Papel do usuário no domínio (vocabulário em inglês; os rótulos exibidos na
 * interface ficam na camada de apresentação — ver `role-label`).
 */
export const ROLES = ['student', 'professor'] as const

export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return value === 'student' || value === 'professor'
}
