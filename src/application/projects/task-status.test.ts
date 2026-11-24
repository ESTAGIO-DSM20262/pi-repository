import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/enterprise/entities/project'
import {
  buildTaskProgressBar,
  canChangeTaskStatus,
  describeTaskDeadline,
  getTaskDisplayStatus,
  statusChangeNote,
  TASK_STATUS_ACTIONS,
  todayInSaoPaulo,
} from './task-status'

const TODAY = '2026-11-10'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    title: 'Projeto',
    summary: 'Resumo',
    cycle: '2026/2',
    semester: 3,
    advisor: { email: 'principal@cps.sp.gov.br', name: 'Principal' },
    coAdvisors: [{ email: 'satelite@cps.sp.gov.br', name: 'Satélite' }],
    memberEmails: ['aluno@aluno.cps.sp.gov.br', 'colega@aluno.cps.sp.gov.br'],
    languages: [],
    stack: [],
    theme: 'Educação',
    status: 'em_andamento',
    verified: false,
    cover: { icon: 'fi-rr-folder-open', label: 'Educação', tone: 'slate' },
    ...overrides,
  }
}

const principal = { role: 'professor' as const, email: 'principal@cps.sp.gov.br' }
const satellite = { role: 'professor' as const, email: 'satelite@cps.sp.gov.br' }
const admin = { role: 'admin' as const, email: 'admin@cps.sp.gov.br' }
const member = { role: 'student' as const, email: 'aluno@aluno.cps.sp.gov.br' }
const outsider = { role: 'student' as const, email: 'fora@aluno.cps.sp.gov.br' }

describe('getTaskDisplayStatus', () => {
  it('marca como atrasada a tarefa em aberto com prazo vencido', () => {
    expect(getTaskDisplayStatus({ status: 'pending', dueDate: '2026-11-09' }, TODAY)).toBe(
      'overdue',
    )
    expect(getTaskDisplayStatus({ status: 'in_progress', dueDate: '2026-11-01' }, TODAY)).toBe(
      'overdue',
    )
  })

  it('não marca como atrasada a que vence hoje, está sem prazo ou foi concluída', () => {
    expect(getTaskDisplayStatus({ status: 'pending', dueDate: TODAY }, TODAY)).toBe('pending')
    expect(getTaskDisplayStatus({ status: 'in_progress', dueDate: null }, TODAY)).toBe(
      'in_progress',
    )
    expect(getTaskDisplayStatus({ status: 'completed', dueDate: '2026-01-01' }, TODAY)).toBe(
      'completed',
    )
  })
})

describe('describeTaskDeadline', () => {
  it('descreve atraso, vencimento próximo e ignora o que não precisa de aviso', () => {
    const open = (dueDate: string | null) => ({ status: 'pending' as const, dueDate })

    expect(describeTaskDeadline(open('2026-11-09'), TODAY)).toBe('Atrasada há 1 dia')
    expect(describeTaskDeadline(open('2026-11-05'), TODAY)).toBe('Atrasada há 5 dias')
    expect(describeTaskDeadline(open(TODAY), TODAY)).toBe('Vence hoje')
    expect(describeTaskDeadline(open('2026-11-11'), TODAY)).toBe('Vence amanhã')
    expect(describeTaskDeadline(open('2026-11-14'), TODAY)).toBe('Vence em 4 dias')
    expect(describeTaskDeadline(open('2026-12-30'), TODAY)).toBeNull()
    expect(describeTaskDeadline(open(null), TODAY)).toBeNull()
    expect(describeTaskDeadline({ status: 'completed', dueDate: '2026-11-01' }, TODAY)).toBeNull()
  })
})

describe('buildTaskProgressBar', () => {
  it('separa concluídas, atrasadas, em andamento e pendentes sem contar duas vezes', () => {
    const bar = buildTaskProgressBar(
      [
        { status: 'completed', dueDate: '2026-11-01' },
        { status: 'completed', dueDate: null },
        { status: 'in_progress', dueDate: '2026-11-02' },
        { status: 'in_progress', dueDate: '2026-12-02' },
        { status: 'pending', dueDate: '2026-11-12' },
        { status: 'pending', dueDate: null },
      ],
      TODAY,
    )

    expect(bar).toEqual({
      total: 6,
      completed: 2,
      overdue: 1,
      inProgress: 1,
      pending: 2,
      dueSoon: 1,
      completionRate: 33,
      allCompleted: false,
    })
    expect(bar.completed + bar.overdue + bar.inProgress + bar.pending).toBe(bar.total)
  })

  it('indica que todas as tarefas foram concluídas e trata a lista vazia', () => {
    expect(buildTaskProgressBar([{ status: 'completed', dueDate: null }], TODAY).allCompleted).toBe(
      true,
    )
    const empty = buildTaskProgressBar([], TODAY)
    expect(empty.total).toBe(0)
    expect(empty.completionRate).toBe(0)
    expect(empty.allCompleted).toBe(false)
  })
})

describe('canChangeTaskStatus', () => {
  const groupTask = { targetStudentEmail: null }
  const memberTask = { targetStudentEmail: 'ALUNO@aluno.cps.sp.gov.br' }
  const colleagueTask = { targetStudentEmail: 'colega@aluno.cps.sp.gov.br' }

  it('o orientador principal e o administrador mudam o status de qualquer tarefa', () => {
    expect(canChangeTaskStatus(makeProject(), principal, colleagueTask)).toBe(true)
    expect(canChangeTaskStatus(makeProject(), admin, colleagueTask)).toBe(true)
    expect(canChangeTaskStatus(makeProject({ status: 'publicado' }), admin, groupTask)).toBe(true)
  })

  it('o aluno muda o status das tarefas do grupo e das atribuídas a ele', () => {
    expect(canChangeTaskStatus(makeProject(), member, groupTask)).toBe(true)
    expect(canChangeTaskStatus(makeProject(), member, memberTask)).toBe(true)
  })

  it('o aluno não muda a tarefa de um colega nem de projeto de outra equipe', () => {
    expect(canChangeTaskStatus(makeProject(), member, colleagueTask)).toBe(false)
    expect(canChangeTaskStatus(makeProject(), outsider, groupTask)).toBe(false)
  })

  it('satélite não muda o status e ninguém além do admin mexe em projeto concluído ou desativado', () => {
    expect(canChangeTaskStatus(makeProject(), satellite, groupTask)).toBe(false)
    expect(canChangeTaskStatus(makeProject({ status: 'publicado' }), principal, groupTask)).toBe(
      false,
    )
    expect(canChangeTaskStatus(makeProject({ status: 'publicado' }), member, groupTask)).toBe(false)
    expect(canChangeTaskStatus(makeProject({ active: false }), member, groupTask)).toBe(false)
  })
})

describe('ações de status', () => {
  it('cada status oferece uma ação principal coerente com o fluxo', () => {
    expect(TASK_STATUS_ACTIONS.pending[0]).toMatchObject({ to: 'in_progress', primary: true })
    expect(TASK_STATUS_ACTIONS.in_progress[0]).toMatchObject({ to: 'completed', primary: true })
    expect(TASK_STATUS_ACTIONS.completed[0]).toMatchObject({ to: 'in_progress', primary: true })
  })

  it('registra a mudança de status na observação da revisão', () => {
    expect(statusChangeNote('pending', 'in_progress')).toBe(
      'Status alterado de Pendente para Em andamento.',
    )
  })
})

describe('todayInSaoPaulo', () => {
  it('usa o fuso de São Paulo para decidir a data', () => {
    expect(todayInSaoPaulo(new Date('2026-11-10T01:30:00Z'))).toBe('2026-11-09')
    expect(todayInSaoPaulo(new Date('2026-11-10T12:00:00Z'))).toBe('2026-11-10')
  })
})
