import { describe, expect, it } from 'vitest'
import type {
  TaskEventNotification,
  TaskEventNotifier,
} from '@/application/notifications/task-event-notifier'
import type { Project } from '@/domain/enterprise/entities/project'
import { InMemoryProjectReader } from '@/test/repositories/in-memory-project-reader'
import { InMemoryProjectTaskRepository } from '@/test/repositories/in-memory-project-task-repository'
import { InMemoryProjectUserDirectory } from '@/test/repositories/in-memory-project-user-directory'
import {
  AssignTaskToProjectsUseCase,
  MAX_BULK_TASK_PROJECTS,
} from './assign-task-to-projects-use-case'

const principal = {
  id: 'prof-1',
  email: 'principal@cps.sp.gov.br',
  name: 'Professora Principal',
  role: 'professor' as const,
}
const satellite = {
  id: 'prof-2',
  email: 'satelite@cps.sp.gov.br',
  name: 'Professor Satélite',
  role: 'professor' as const,
}
const admin = {
  id: 'adm-1',
  email: 'admin@cps.sp.gov.br',
  name: 'Administração',
  role: 'admin' as const,
}
const student = {
  id: 'stu-1',
  email: 'aluno@aluno.cps.sp.gov.br',
  name: 'Aluno',
  role: 'student' as const,
}

function makeProject(id: string, overrides: Partial<Project> = {}): Project {
  return {
    id,
    title: `Projeto ${id}`,
    summary: 'Resumo',
    cycle: '2026/2',
    semester: 3,
    advisor: { email: principal.email, name: principal.name },
    coAdvisors: [{ email: satellite.email, name: satellite.name }],
    memberEmails: [student.email],
    languages: [],
    stack: [],
    theme: 'Educação',
    status: 'em_andamento',
    verified: false,
    cover: { icon: 'fi-rr-folder-open', label: 'Educação', tone: 'slate' },
    ...overrides,
  }
}

const body = {
  title: 'Entrega do relatório parcial',
  description: 'Enviar o relatório parcial do projeto até a data combinada.',
  dueDate: '2026-12-01',
}

function setup(projects: Project[]) {
  const tasks = new InMemoryProjectTaskRepository()
  const users = new InMemoryProjectUserDirectory([principal, satellite, admin, student], [], [])
  const useCase = new AssignTaskToProjectsUseCase(new InMemoryProjectReader(projects), tasks, users)
  return { tasks, useCase }
}

describe('AssignTaskToProjectsUseCase — notificações', () => {
  it('avisa uma vez por projeto em que a tarefa foi criada e não avisa os ignorados', async () => {
    const sent: TaskEventNotification[] = []
    const notifier: TaskEventNotifier = {
      notify: async (event) => {
        sent.push(event)
      },
    }
    const users = new InMemoryProjectUserDirectory([principal, satellite, admin, student], [], [])
    const useCase = new AssignTaskToProjectsUseCase(
      new InMemoryProjectReader([
        makeProject('a'),
        makeProject('done', { status: 'publicado' }),
      ]),
      new InMemoryProjectTaskRepository(),
      users,
      notifier,
    )

    await useCase.execute({ sessionUserId: principal.id, projectIds: ['a', 'done'], body })

    expect(sent).toHaveLength(1)
    expect(sent[0].projectId).toBe('a')
    expect(sent[0].event).toBe('created')
    expect(sent[0].actor).toEqual({
      email: principal.email,
      name: principal.name,
      role: 'professor',
    })
  })
})

describe('AssignTaskToProjectsUseCase', () => {
  it('cria a mesma tarefa em cada projeto selecionado, para o grupo todo', async () => {
    const { tasks, useCase } = setup([makeProject('a'), makeProject('b')])

    const result = await useCase.execute({
      sessionUserId: principal.id,
      projectIds: ['a', 'b'],
      body,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.created.map((item) => item.projectId)).toEqual(['a', 'b'])
      expect(result.value.skipped).toEqual([])
    }
    expect(tasks.tasks).toHaveLength(2)
    expect(tasks.revisions).toHaveLength(2)
    for (const task of tasks.tasks) {
      expect(task.title).toBe(body.title)
      expect(task.dueDate).toBe('2026-12-01')
      expect(task.targetStudentEmail).toBeNull()
      expect(task.status).toBe('pending')
      expect(task.versionMajor).toBe(1)
      expect(task.createdByUserId).toBe(principal.id)
    }
    expect(tasks.revisions.every((revision) => revision.action === 'created')).toBe(true)
  })

  it('continua a numeração de versão de cada projeto', async () => {
    const { tasks, useCase } = setup([makeProject('a'), makeProject('b')])
    tasks.tasks.push({
      id: 'old',
      projectId: 'a',
      title: 'Antiga',
      description: 'Descrição antiga',
      versionMajor: 3,
      versionMinor: 2,
      status: 'completed',
      targetStudentEmail: null,
      dueDate: null,
      createdByUserId: principal.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await useCase.execute({ sessionUserId: principal.id, projectIds: ['a', 'b'], body })

    const byProject = new Map(tasks.tasks.slice(1).map((task) => [task.projectId, task]))
    expect(byProject.get('a')?.versionMajor).toBe(4)
    expect(byProject.get('b')?.versionMajor).toBe(1)
  })

  it('o professor só atribui nos projetos em que é orientador principal e explica o motivo', async () => {
    const { tasks, useCase } = setup([
      makeProject('own'),
      makeProject('done', { status: 'publicado' }),
      makeProject('off', { active: false }),
      makeProject('other', { advisor: { email: 'outro@cps.sp.gov.br', name: 'Outro' } }),
    ])

    const result = await useCase.execute({
      sessionUserId: principal.id,
      projectIds: ['own', 'done', 'off', 'other', 'missing'],
      body,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.created.map((item) => item.projectId)).toEqual(['own'])
      expect(result.value.skipped.map((item) => [item.projectId, item.reason])).toEqual([
        ['done', 'Projeto concluído: não aceita novas tarefas.'],
        ['off', 'Projeto desativado.'],
        ['other', 'Você não é orientador deste projeto.'],
        ['missing', 'Projeto não encontrado.'],
      ])
    }
    expect(tasks.tasks).toHaveLength(1)
  })

  it('o orientador satélite não cria tarefas', async () => {
    const { tasks, useCase } = setup([makeProject('a')])

    const result = await useCase.execute({
      sessionUserId: satellite.id,
      projectIds: ['a'],
      body,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.skipped[0]?.reason).toBe('Somente o orientador principal cria tarefas.')
    }
    expect(tasks.tasks).toHaveLength(0)
  })

  it('o administrador atribui em qualquer projeto, inclusive de outros orientadores', async () => {
    const { tasks, useCase } = setup([
      makeProject('a'),
      makeProject('b', { advisor: { email: 'outro@cps.sp.gov.br', name: 'Outro' } }),
    ])

    const result = await useCase.execute({ sessionUserId: admin.id, projectIds: ['a', 'b'], body })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect(result.value.created).toHaveLength(2)
    expect(tasks.tasks.every((task) => task.createdByUserId === admin.id)).toBe(true)
  })

  it('recusa aluno, usuário desconhecido e sessão ausente', async () => {
    const { tasks, useCase } = setup([makeProject('a')])

    const asStudent = await useCase.execute({
      sessionUserId: student.id,
      projectIds: ['a'],
      body,
    })
    const unknown = await useCase.execute({ sessionUserId: 'ghost', projectIds: ['a'], body })
    const anonymous = await useCase.execute({ sessionUserId: '', projectIds: ['a'], body })

    expect(asStudent.isLeft() && asStudent.value.status).toBe(403)
    expect(unknown.isLeft() && unknown.value.status).toBe(403)
    expect(anonymous.isLeft() && anonymous.value.status).toBe(401)
    expect(tasks.tasks).toHaveLength(0)
  })

  it('valida os dados da tarefa e a lista de projetos', async () => {
    const { tasks, useCase } = setup([makeProject('a')])

    const invalidTitle = await useCase.execute({
      sessionUserId: principal.id,
      projectIds: ['a'],
      body: { ...body, title: 'ab' },
    })
    const invalidDate = await useCase.execute({
      sessionUserId: principal.id,
      projectIds: ['a'],
      body: { ...body, dueDate: '2026-02-31' },
    })
    const noProjects = await useCase.execute({ sessionUserId: principal.id, projectIds: [], body })
    const notAList = await useCase.execute({ sessionUserId: principal.id, projectIds: 'a', body })
    const tooMany = await useCase.execute({
      sessionUserId: principal.id,
      projectIds: Array.from({ length: MAX_BULK_TASK_PROJECTS + 1 }, (_, index) => `p${index}`),
      body,
    })

    for (const result of [invalidTitle, invalidDate, noProjects, notAList, tooMany]) {
      expect(result.isLeft() && result.value.status).toBe(400)
    }
    expect(tasks.tasks).toHaveLength(0)
  })

  it('aceita tarefa sem prazo e ignora ids repetidos', async () => {
    const { tasks, useCase } = setup([makeProject('a')])

    const result = await useCase.execute({
      sessionUserId: principal.id,
      projectIds: ['a', 'a'],
      body: { title: body.title, description: body.description },
    })

    expect(result.isRight()).toBe(true)
    expect(tasks.tasks).toHaveLength(1)
    expect(tasks.tasks[0]?.dueDate).toBeNull()
  })

  it('não grava nada quando nenhum projeto é elegível', async () => {
    const { tasks, useCase } = setup([makeProject('done', { status: 'publicado' })])

    const result = await useCase.execute({
      sessionUserId: principal.id,
      projectIds: ['done'],
      body,
    })

    expect(result.isRight() && result.value.created).toEqual([])
    expect(tasks.tasks).toHaveLength(0)
  })
})
