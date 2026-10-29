import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/enterprise/entities/project'
import {
  canEditProgressTask,
  canManageActivation,
  canManageProgress,
  canVerifyProject,
  canViewProject,
  resolveProjectEditScope,
} from './project-permissions'

type Subject = Pick<Project, 'advisor' | 'coAdvisors' | 'status' | 'active' | 'memberEmails'>

const principal = { id: 'p1', email: 'principal@cps.sp.gov.br', role: 'professor' as const }
const satellite = { id: 'p2', email: 'Satelite@cps.sp.gov.br', role: 'professor' as const }
const outsider = { id: 'p3', email: 'fora@cps.sp.gov.br', role: 'professor' as const }
const admin = { id: 'a1', email: 'admin@cps.sp.gov.br', role: 'admin' as const }
const member = { id: 's1', email: 'aluno@aluno.cps.sp.gov.br', role: 'student' as const }

function makeProject(overrides: Partial<Subject> = {}): Subject {
  return {
    advisor: { email: principal.email, name: 'Principal' },
    coAdvisors: [{ email: 'satelite@cps.sp.gov.br', name: 'Satélite' }],
    status: 'em_andamento',
    memberEmails: [member.email],
    ...overrides,
  }
}

describe('resolveProjectEditScope', () => {
  it('dá escopo completo a qualquer orientador, inclusive co-orientadores', () => {
    expect(resolveProjectEditScope(makeProject(), principal)).toBe('full')
    expect(resolveProjectEditScope(makeProject(), satellite)).toBe('full')
  })

  it('dá escopo de administrador ao admin e nega ao restante', () => {
    expect(resolveProjectEditScope(makeProject(), admin)).toBe('admin')
    expect(resolveProjectEditScope(makeProject(), outsider)).toBeNull()
    expect(resolveProjectEditScope(makeProject(), member)).toBeNull()
  })
})

describe('canViewProject', () => {
  it('projeto desativado só é visível para o administrador, mesmo para os orientadores', () => {
    const inactive = makeProject({ status: 'publicado', active: false })

    expect(canViewProject(inactive, admin)).toBe(true)
    expect(canViewProject(inactive, principal)).toBe(false)
    expect(canViewProject(inactive, member)).toBe(false)
    expect(canViewProject(inactive, null)).toBe(false)
  })

  it('projeto em andamento e ativo é visível para todos, inclusive visitantes', () => {
    const project = makeProject()

    expect(canViewProject(project, satellite)).toBe(true)
    expect(canViewProject(project, member)).toBe(true)
    expect(canViewProject(project, outsider)).toBe(true)
    expect(canViewProject(project, null)).toBe(true)
  })

  it('projeto concluído e ativo é público', () => {
    expect(canViewProject(makeProject({ status: 'publicado' }), null)).toBe(true)
  })
})

describe('permissões de tarefas do progresso', () => {
  const task = { createdByUserId: principal.id }

  it('o professor só edita as tarefas que ele mesmo criou', () => {
    const project = makeProject()

    expect(canEditProgressTask(project, principal, task)).toBe(true)
    expect(canEditProgressTask(project, satellite, task)).toBe(false)
    expect(canEditProgressTask(project, satellite, { createdByUserId: satellite.id })).toBe(true)
  })

  it('o administrador edita qualquer tarefa', () => {
    expect(canEditProgressTask(makeProject(), admin, task)).toBe(true)
  })

  it('ninguém edita tarefas de projeto concluído e aluno nunca edita', () => {
    const done = makeProject({ status: 'publicado' })

    expect(canEditProgressTask(done, principal, task)).toBe(false)
    expect(canEditProgressTask(makeProject(), member, task)).toBe(false)
    expect(canManageProgress(done, admin)).toBe(false)
  })

  it('co-orientador gerencia o progresso, assim como o principal', () => {
    expect(canManageProgress(makeProject(), satellite)).toBe(true)
    expect(canManageProgress(makeProject(), outsider)).toBe(false)
  })
})

describe('canVerifyProject', () => {
  it('só existe para projetos concluídos e ativos', () => {
    expect(canVerifyProject(makeProject({ status: 'em_andamento' }), principal)).toBe(false)
    expect(canVerifyProject(makeProject({ status: 'publicado', active: false }), principal)).toBe(
      false,
    )
    expect(canVerifyProject(makeProject({ status: 'publicado' }), principal)).toBe(true)
  })

  it('vale para orientadores e administrador, e não para outros', () => {
    const done = makeProject({ status: 'publicado' })

    expect(canVerifyProject(done, satellite)).toBe(true)
    expect(canVerifyProject(done, admin)).toBe(true)
    expect(canVerifyProject(done, outsider)).toBe(false)
    expect(canVerifyProject(done, member)).toBe(false)
  })
})

describe('canManageActivation', () => {
  it('é exclusivo do administrador', () => {
    expect(canManageActivation(admin)).toBe(true)
    expect(canManageActivation(principal)).toBe(false)
    expect(canManageActivation(member)).toBe(false)
  })
})
