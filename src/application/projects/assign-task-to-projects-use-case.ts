import type { UseCase } from '@/core/application/use-case'
import { type Either, left, right } from '@/core/either'
import type { Project } from '@/domain/enterprise/entities/project'
import { isProjectActive } from '@/domain/enterprise/entities/project-advisors'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'
import type {
  ProjectRevisionCreateRecord,
  ProjectTaskCreateRecord,
} from '@/domain/enterprise/repositories/project-repository'
import type { ProjectTaskRepository } from '@/domain/enterprise/repositories/project-task-repository'
import type { ProjectUserDirectory } from '@/domain/enterprise/repositories/project-user-directory'
import type { TaskEventNotifier } from '@/domain/enterprise/repositories/task-event-notifier'
import { ProjectOperationError } from './project-operation-error'
import { canManageProgress, isAdvisorOf } from './project-permissions'
import { parseTaskFields } from './task-fields'

export const MAX_BULK_TASK_PROJECTS = 100

interface AssignTaskToProjectsRequest {
  sessionUserId: string
  projectIds: unknown
  body: unknown
}

export interface AssignedTask {
  projectId: string
  projectTitle: string
  taskId: string
}

export interface SkippedAssignment {
  projectId: string
  projectTitle: string
  reason: string
}

export interface AssignTaskToProjectsResponse {
  created: AssignedTask[]
  skipped: SkippedAssignment[]
}

type AssignTaskToProjectsOutput = Either<ProjectOperationError, AssignTaskToProjectsResponse>

type Viewer = { role: 'professor' | 'admin'; email: string }

function explainDenial(project: Project, viewer: Viewer) {
  if (!isProjectActive(project)) return 'Projeto desativado.'
  if (project.status !== 'em_andamento') return 'Projeto concluído: não aceita novas tarefas.'
  if (isAdvisorOf(project, viewer)) return 'Somente o orientador principal cria tarefas.'
  return 'Você não é orientador deste projeto.'
}

export class AssignTaskToProjectsUseCase
  implements UseCase<AssignTaskToProjectsRequest, AssignTaskToProjectsOutput>
{
  constructor(
    private readonly reader: ProjectReader,
    private readonly tasks: ProjectTaskRepository,
    private readonly users: ProjectUserDirectory,
    private readonly notifier?: TaskEventNotifier,
  ) {}

  async execute({
    sessionUserId,
    projectIds,
    body,
  }: AssignTaskToProjectsRequest): Promise<AssignTaskToProjectsOutput> {
    if (!sessionUserId) {
      return left(new ProjectOperationError('É necessário entrar no sistema.', 401))
    }

    const account = await this.users.findActiveAccountById(sessionUserId)
    if (!account || (account.role !== 'admin' && account.role !== 'professor')) {
      return left(
        new ProjectOperationError(
          'Somente professores e administradores atribuem tarefas a projetos.',
          403,
        ),
      )
    }
    const viewer: Viewer = { role: account.role, email: account.email.trim().toLowerCase() }

    const fields = parseTaskFields(body)
    if (fields.isLeft()) return left(new ProjectOperationError(fields.value.message, 400))

    const ids = Array.isArray(projectIds)
      ? [...new Set(projectIds.filter((id): id is string => typeof id === 'string' && id !== ''))]
      : []
    if (ids.length === 0) {
      return left(new ProjectOperationError('Selecione pelo menos um projeto.', 400))
    }
    if (ids.length > MAX_BULK_TASK_PROJECTS) {
      return left(
        new ProjectOperationError(
          `Selecione no máximo ${MAX_BULK_TASK_PROJECTS} projetos por vez.`,
          400,
        ),
      )
    }

    const allProjects = await this.reader.findAll()
    const projectsById = new Map(allProjects.map((project) => [project.id, project]))
    const eligible: Project[] = []
    const skipped: SkippedAssignment[] = []
    for (const id of ids) {
      const project = projectsById.get(id)
      if (!project) {
        skipped.push({
          projectId: id,
          projectTitle: 'Projeto não encontrado',
          reason: 'Projeto não encontrado.',
        })
        continue
      }
      if (!canManageProgress(project, viewer)) {
        skipped.push({
          projectId: id,
          projectTitle: project.title,
          reason: explainDenial(project, viewer),
        })
        continue
      }
      eligible.push(project)
    }

    if (eligible.length === 0) return right({ created: [], skipped })

    const latest = await this.tasks.latestVersionMajors(eligible.map((project) => project.id))
    const now = new Date()
    const tasks: ProjectTaskCreateRecord[] = []
    const revisions: ProjectRevisionCreateRecord[] = []
    for (const project of eligible) {
      const task: ProjectTaskCreateRecord = {
        id: globalThis.crypto.randomUUID(),
        projectId: project.id,
        title: fields.value.title,
        description: fields.value.description,
        versionMajor: (latest.get(project.id) ?? 0) + 1,
        versionMinor: 0,
        status: 'pending',
        targetStudentEmail: null,
        dueDate: fields.value.dueDate,
        createdByUserId: account.id,
        createdAt: now,
        updatedAt: now,
      }
      tasks.push(task)
      revisions.push({
        id: globalThis.crypto.randomUUID(),
        taskId: task.id,
        projectId: project.id,
        title: task.title,
        description: task.description,
        versionMajor: task.versionMajor,
        versionMinor: task.versionMinor,
        status: task.status,
        targetStudentEmail: task.targetStudentEmail,
        dueDate: task.dueDate,
        action: 'created',
        changeNote: 'Tarefa criada em lote para vários projetos',
        changedByUserId: account.id,
        changedAt: now,
      })
    }

    await this.tasks.createMany(tasks, revisions)

    const notifier = this.notifier
    if (notifier) {
      await Promise.all(
        eligible.map((project, index) =>
          notifier.notify({
            event: 'created',
            projectId: project.id,
            taskId: tasks[index].id,
            project,
            task: { title: tasks[index].title, targetStudentEmail: null },
            actor: { email: account.email, name: account.name, role: account.role },
          }),
        ),
      )
    }

    return right({
      created: eligible.map((project, index) => ({
        projectId: project.id,
        projectTitle: project.title,
        taskId: tasks[index].id,
      })),
      skipped,
    })
  }
}
