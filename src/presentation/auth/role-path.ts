import type { Role } from '@/domain/enterprise/entities/role'

export const ROLE_DASHBOARD_PATH: Record<Role, string> = {
  student: '/aluno',
  professor: '/professor',
  admin: '/admin',
}
