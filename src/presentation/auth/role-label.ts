import type { Role } from '@/domain/enterprise/entities/role'

/** Rótulos em português para exibição (o domínio usa o vocabulário em inglês). */
export const ROLE_LABEL: Record<Role, string> = {
  student: 'Aluno',
  professor: 'Professor',
}
