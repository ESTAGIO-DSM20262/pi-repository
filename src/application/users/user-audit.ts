import type { Role } from '@/domain/enterprise/entities/role'
import type {
  UserAuditAction,
  UserAuditChange,
  UserAuditDetails,
} from '@/domain/enterprise/entities/user-audit'

export interface UserAuditSnapshot {
  name: string
  email: string
  role: Role
  registrationNumber: string | null
  course: string | null
  active: boolean
}

export interface UserAuditDraft {
  action: UserAuditAction
  summary: string
  details: UserAuditDetails
}

export type UserCreationSource = 'individual' | 'planilha'

export const USER_AUDIT_ACTION_LABEL: Record<UserAuditAction, string> = {
  created: 'Cadastro',
  updated: 'Edição',
  activated: 'Ativação',
  deactivated: 'Desativação',
}

const ROLE_LABEL: Record<Role, string> = {
  student: 'Aluno',
  professor: 'Professor',
  admin: 'Administrador',
}

const FIELDS: Array<{
  field: keyof UserAuditSnapshot
  label: string
  display: (snapshot: UserAuditSnapshot) => string | null
}> = [
  { field: 'name', label: 'Nome', display: (user) => user.name },
  { field: 'email', label: 'E-mail', display: (user) => user.email },
  { field: 'role', label: 'Perfil', display: (user) => ROLE_LABEL[user.role] },
  {
    field: 'registrationNumber',
    label: 'RA/matrícula',
    display: (user) => user.registrationNumber?.trim() || null,
  },
  { field: 'course', label: 'Curso', display: (user) => user.course?.trim() || null },
  { field: 'active', label: 'Situação', display: (user) => (user.active ? 'Ativo' : 'Inativo') },
]

export function describeUserChanges(
  before: UserAuditSnapshot,
  after: UserAuditSnapshot,
): UserAuditChange[] {
  const changes: UserAuditChange[] = []
  for (const { field, label, display } of FIELDS) {
    const from = display(before)
    const to = display(after)
    if (from !== to) changes.push({ field, label, from, to })
  }
  return changes
}

export function buildUserUpdateAudit(
  before: UserAuditSnapshot,
  after: UserAuditSnapshot,
): UserAuditDraft | null {
  const changes = describeUserChanges(before, after)
  if (changes.length === 0) return null

  if (changes.length === 1 && changes[0].field === 'active') {
    return after.active
      ? { action: 'activated', summary: 'Usuário ativado', details: { changes } }
      : { action: 'deactivated', summary: 'Usuário desativado', details: { changes } }
  }

  const labels = changes.map((change) => change.label)
  return {
    action: 'updated',
    summary: `Dados atualizados: ${labels.join(', ')}`,
    details: { changes },
  }
}

export function buildUserCreationAudit(
  user: UserAuditSnapshot,
  source: UserCreationSource,
): UserAuditDraft {
  const facts = FIELDS.filter(({ field }) => field !== 'active')
    .map(({ label, display }) => ({ label, value: display(user) }))
    .filter((fact): fact is { label: string; value: string } => fact.value !== null)

  return {
    action: 'created',
    summary: source === 'planilha' ? 'Usuário cadastrado por planilha' : 'Usuário cadastrado',
    details: {
      facts,
      note: 'Convite para definir a senha enviado por e-mail.',
    },
  }
}
