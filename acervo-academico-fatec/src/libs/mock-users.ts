import type { Role, User } from '@/types/auth'

type MockUser = User & { password: string }

export const MOCK_USERS: MockUser[] = [
  { id: '1', name: 'Administrador Teste', email: 'admin@cps.sp.gov.br', password: '123456', role: 'admin' },
  { id: '2', name: 'Professor Teste', email: 'professor@cps.sp.gov.br', password: '123456', role: 'professor' },
  { id: '3', name: 'Aluno Teste', email: 'aluno@aluno.sp.gov.br', password: '123456', role: 'aluno' },
]

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  professor: 'Professor',
  aluno: 'Aluno',
}