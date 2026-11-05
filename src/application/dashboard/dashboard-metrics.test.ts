import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/enterprise/entities/project'
import {
  buildAdminDashboardMetrics,
  buildProfessorDashboardMetrics,
  buildStudentDashboardMetrics,
  type DashboardTask,
  daysFromToday,
  isTaskOverdue,
  summarizeTasks,
} from './dashboard-metrics'

const TODAY = '2026-10-28'
const NOW = new Date('2026-10-28T12:00:00.000Z')

function makeProject(overrides: Partial<Project> & Pick<Project, 'id'>): Project {
  return {
    title: `Projeto ${overrides.id}`,
    summary: 'Resumo',
    cycle: '2026-2',
    semester: 3,
    advisor: { email: 'ana@fatec.sp.gov.br', name: 'Ana Souza' },
    memberEmails: [],
    languages: [],
    stack: [],
    theme: 'Tema',
    status: 'em_andamento',
    verified: false,
    cover: { icon: 'x', label: 'x', tone: 'red' },
    ...overrides,
  }
}

function makeTask(overrides: Partial<DashboardTask> & Pick<DashboardTask, 'id'>): DashboardTask {
  return {
    projectId: 'p1',
    title: `Tarefa ${overrides.id}`,
    versionMajor: 1,
    versionMinor: 0,
    status: 'pending',
    targetStudentEmail: null,
    dueDate: null,
    updatedAt: '2026-10-27T10:00:00.000Z',
    ...overrides,
  }
}

describe('dashboard-metrics', () => {
  it('calcula a diferenca de dias entre datas', () => {
    expect(daysFromToday('2026-10-30', TODAY)).toBe(2)
    expect(daysFromToday('2026-10-28', TODAY)).toBe(0)
    expect(daysFromToday('2026-10-25', TODAY)).toBe(-3)
    expect(daysFromToday('2026-11-02', TODAY)).toBe(5)
  })

  it('considera atrasada apenas tarefa aberta com prazo vencido', () => {
    expect(isTaskOverdue({ status: 'pending', dueDate: '2026-10-27' }, TODAY)).toBe(true)
    expect(isTaskOverdue({ status: 'in_progress', dueDate: '2026-10-28' }, TODAY)).toBe(false)
    expect(isTaskOverdue({ status: 'completed', dueDate: '2026-10-01' }, TODAY)).toBe(false)
    expect(isTaskOverdue({ status: 'pending', dueDate: null }, TODAY)).toBe(false)
  })

  it('resume tarefas por status, atraso, prazo proximo e taxa de conclusao', () => {
    const summary = summarizeTasks(
      [
        makeTask({ id: 'a', status: 'completed' }),
        makeTask({ id: 'b', status: 'in_progress', dueDate: '2026-10-30' }),
        makeTask({ id: 'c', status: 'pending', dueDate: '2026-10-20' }),
        makeTask({ id: 'd', status: 'pending', dueDate: '2026-12-01' }),
      ],
      TODAY,
    )
    expect(summary.total).toBe(4)
    expect(summary.completed).toBe(1)
    expect(summary.inProgress).toBe(1)
    expect(summary.pending).toBe(2)
    expect(summary.open).toBe(3)
    expect(summary.overdue).toBe(1)
    expect(summary.dueSoon).toBe(1)
    expect(summary.completionRate).toBe(25)
  })

  it('monta o painel do professor com projetos, atencao e indicacoes pendentes', () => {
    const projects = [
      makeProject({
        id: 'p1',
        teamMembers: [{ studentEmail: 'bia@aluno.fatec.sp.gov.br', name: 'Bia Lima' }],
      }),
      makeProject({ id: 'p2' }),
      makeProject({ id: 'p3', status: 'publicado' }),
      makeProject({ id: 'p4', status: 'publicado', verified: true }),
      makeProject({ id: 'p5', status: 'publicado' }),
      makeProject({ id: 'p6', active: false }),
    ]
    const tasks = [
      makeTask({
        id: 't1',
        projectId: 'p1',
        status: 'pending',
        dueDate: '2026-10-20',
        targetStudentEmail: 'bia@aluno.fatec.sp.gov.br',
      }),
      makeTask({ id: 't2', projectId: 'p1', status: 'completed' }),
      makeTask({
        id: 't3',
        projectId: 'p1',
        status: 'in_progress',
        dueDate: '2026-11-02',
        targetStudentEmail: 'bia@aluno.fatec.sp.gov.br',
      }),
      makeTask({ id: 't4', projectId: 'p6', status: 'pending' }),
    ]

    const metrics = buildProfessorDashboardMetrics({
      projects,
      tasks,
      indicatedProjectIds: ['p5'],
      today: TODAY,
      now: NOW,
    })

    expect(metrics.projects.total).toBe(5)
    expect(metrics.projects.ongoing).toBe(2)
    expect(metrics.projects.completed).toBe(3)
    expect(metrics.projects.indicated).toBe(1)
    expect(metrics.projects.awaitingMyIndication).toBe(1)
    expect(metrics.awaitingIndication[0]?.projectId).toBe('p3')
    expect(metrics.projects.withoutTasks).toBe(1)
    expect(metrics.tasks.total).toBe(3)
    expect(metrics.tasks.overdue).toBe(1)
    expect(metrics.progress[0]?.projectId).toBe('p1')
    expect(metrics.progress[0]?.percent).toBe(33)
    expect(metrics.progress[0]?.nextDueDate).toBe('2026-11-02')
    expect(metrics.deadlines).toHaveLength(2)
    expect(metrics.deadlines[0]?.taskId).toBe('t1')
    expect(metrics.deadlines[0]?.daysUntilDue).toBe(-8)
    expect(metrics.deadlines[0]?.studentName).toBe('Bia Lima')
    expect(metrics.students[0]?.name).toBe('Bia Lima')
    expect(metrics.students[0]?.overdue).toBe(1)
  })

  it('marca projeto parado e projeto pronto para concluir', () => {
    const projects = [makeProject({ id: 'p1' }), makeProject({ id: 'p2' })]
    const tasks = [
      makeTask({ id: 't1', projectId: 'p1', updatedAt: '2026-10-01T10:00:00.000Z' }),
      makeTask({ id: 't2', projectId: 'p2', status: 'completed' }),
    ]
    const metrics = buildProfessorDashboardMetrics({
      projects,
      tasks,
      indicatedProjectIds: [],
      today: TODAY,
      now: NOW,
    })
    const stalled = metrics.progress.find((row) => row.projectId === 'p1')
    const ready = metrics.progress.find((row) => row.projectId === 'p2')
    expect(stalled?.stalled).toBe(true)
    expect(ready?.readyToConclude).toBe(true)
    expect(metrics.projects.stalled).toBe(1)
    expect(metrics.projects.readyToConclude).toBe(1)
  })

  it('monta o painel do administrador com desativados, pendencias e carga de orientadores', () => {
    const projects = [
      makeProject({ id: 'p1', memberEmails: ['aluno1@aluno.fatec.sp.gov.br'] }),
      makeProject({
        id: 'p2',
        status: 'publicado',
        advisor: { email: 'bruno@fatec.sp.gov.br', name: 'Bruno Alves' },
      }),
      makeProject({ id: 'p3', status: 'publicado', verified: true }),
      makeProject({ id: 'p4', active: false }),
    ]
    const tasks = [
      makeTask({ id: 't1', projectId: 'p1', dueDate: '2026-10-10' }),
      makeTask({ id: 't2', projectId: 'p4', dueDate: '2026-10-10' }),
    ]

    const metrics = buildAdminDashboardMetrics({
      projects,
      tasks,
      activeStudentEmails: ['aluno1@aluno.fatec.sp.gov.br', 'aluno2@aluno.fatec.sp.gov.br'],
      activeProfessorEmails: ['ana@fatec.sp.gov.br', 'carla@fatec.sp.gov.br'],
      today: TODAY,
      now: NOW,
    })

    expect(metrics.projects.total).toBe(3)
    expect(metrics.projects.deactivated).toBe(1)
    expect(metrics.projects.ongoing).toBe(1)
    expect(metrics.projects.completed).toBe(2)
    expect(metrics.projects.indicated).toBe(1)
    expect(metrics.projects.awaitingIndication).toBe(1)
    expect(metrics.tasks.total).toBe(1)
    expect(metrics.tasks.overdue).toBe(1)
    expect(metrics.attention[0]?.projectId).toBe('p1')
    expect(metrics.advisorLoad[0]?.email).toBe('ana@fatec.sp.gov.br')
    expect(metrics.advisorLoad[0]?.ongoing).toBe(1)
    expect(metrics.people.studentsWithoutProject).toBe(1)
    expect(metrics.people.professorsWithoutProject).toBe(1)
  })

  it('monta o painel do aluno considerando só as tarefas dele e as da equipe toda', () => {
    const projects = [
      makeProject({ id: 'p1', memberEmails: ['joao@aluno.cps.sp.gov.br'] }),
      makeProject({ id: 'p2', status: 'publicado', verified: true }),
    ]
    const tasks = [
      makeTask({ id: 't1', status: 'completed' }),
      makeTask({ id: 't2', targetStudentEmail: 'JOAO@aluno.cps.sp.gov.br', dueDate: '2026-10-25' }),
      makeTask({
        id: 't3',
        targetStudentEmail: 'maria@aluno.cps.sp.gov.br',
        dueDate: '2026-10-20',
      }),
      makeTask({ id: 't4', dueDate: '2026-10-30' }),
    ]

    const metrics = buildStudentDashboardMetrics({
      projects,
      tasks,
      email: 'joao@aluno.cps.sp.gov.br',
      today: TODAY,
      now: NOW,
    })

    expect(metrics.projects).toEqual({ total: 2, ongoing: 1, completed: 1, indicated: 1 })
    expect(metrics.tasks.total).toBe(3)
    expect(metrics.tasks.overdue).toBe(1)
    expect(metrics.tasks.dueSoon).toBe(1)
    expect(metrics.deadlines.map((row) => row.taskId)).toEqual(['t2', 't4'])
    expect(metrics.progress).toHaveLength(1)
    expect(metrics.progress[0].total).toBe(4)
    expect(metrics.progress[0].percent).toBe(25)
  })
})
