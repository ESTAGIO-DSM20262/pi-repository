export const ROLES = ['student', 'professor', 'admin'] as const

export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return value === 'student' || value === 'professor' || value === 'admin'
}
