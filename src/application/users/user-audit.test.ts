import { describe, expect, it } from 'vitest'
import {
  buildUserCreationAudit,
  buildUserUpdateAudit,
  describeUserChanges,
  type UserAuditSnapshot,
} from './user-audit'

const base: UserAuditSnapshot = {
  name: 'Maria Souza',
  email: 'maria@fatec.sp.gov.br',
  role: 'student',
  registrationNumber: '1234567890123',
  course: 'DSM',
  active: true,
}

describe('describeUserChanges', () => {
  it('lista só os campos que mudaram, com valores legíveis', () => {
    const changes = describeUserChanges(base, {
      ...base,
      role: 'professor',
      course: null,
    })

    expect(changes).toEqual([
      { field: 'role', label: 'Perfil', from: 'Aluno', to: 'Professor' },
      { field: 'course', label: 'Curso', from: 'DSM', to: null },
    ])
  })

  it('não registra nada quando nada mudou', () => {
    expect(describeUserChanges(base, { ...base })).toEqual([])
  })
})

describe('buildUserUpdateAudit', () => {
  it('retorna null quando não há mudança', () => {
    expect(buildUserUpdateAudit(base, { ...base })).toBeNull()
  })

  it('classifica como desativação quando só a situação muda', () => {
    const audit = buildUserUpdateAudit(base, { ...base, active: false })

    expect(audit?.action).toBe('deactivated')
    expect(audit?.summary).toBe('Usuário desativado')
    expect(audit?.details.changes).toEqual([
      { field: 'active', label: 'Situação', from: 'Ativo', to: 'Inativo' },
    ])
  })

  it('classifica como ativação quando só a situação muda para ativo', () => {
    const audit = buildUserUpdateAudit({ ...base, active: false }, base)

    expect(audit?.action).toBe('activated')
  })

  it('resume os campos editados', () => {
    const audit = buildUserUpdateAudit(base, { ...base, name: 'Maria S. Souza', active: false })

    expect(audit?.action).toBe('updated')
    expect(audit?.summary).toBe('Dados atualizados: Nome, Situação')
  })
})

describe('buildUserCreationAudit', () => {
  it('registra os dados do cadastro e a origem', () => {
    const audit = buildUserCreationAudit(base, 'planilha')

    expect(audit.action).toBe('created')
    expect(audit.summary).toBe('Usuário cadastrado por planilha')
    expect(audit.details.facts).toContainEqual({ label: 'Perfil', value: 'Aluno' })
    expect(audit.details.facts?.some((fact) => fact.label === 'Situação')).toBe(false)
  })

  it('omite campos vazios', () => {
    const audit = buildUserCreationAudit(
      { ...base, role: 'admin', registrationNumber: null, course: null },
      'individual',
    )

    expect(audit.summary).toBe('Usuário cadastrado')
    expect(audit.details.facts?.map((fact) => fact.label)).toEqual(['Nome', 'E-mail', 'Perfil'])
  })
})
