export const ROLES = ['student', 'professor'] as const

export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return value === 'student' || value === 'professor'
}
