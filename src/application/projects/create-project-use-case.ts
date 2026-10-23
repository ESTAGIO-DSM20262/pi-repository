import type { UseCase } from '@/core/application/use-case'
import { type Either, left, right } from '@/core/either'
import {
  buildProjectLinks,
  buildTechnologyGroups,
} from '@/domain/enterprise/entities/project-details'
import type {
  ProjectCreateRecord,
  ProjectRepository,
  ProjectRevisionCreateRecord,
  ProjectTaskCreateRecord,
} from '@/domain/enterprise/repositories/project-repository'
import type { ProjectUserDirectory } from '@/domain/enterprise/repositories/project-user-directory'
import { parseCreateProjectInput } from './create-project'
import { ProjectOperationError } from './project-operation-error'

interface CreateProjectRequest {
  sessionUserId: string
  body: unknown
}

interface CreateProjectResponse {
  id: string
  tasksCreated: number
}

export class CreateProjectUseCase
  implements UseCase<CreateProjectRequest, Either<ProjectOperationError, CreateProjectResponse>>
{
  constructor(
    private readonly projects: ProjectRepository,
    private readonly users: ProjectUserDirectory,
  ) {}

  async execute({
    sessionUserId,
    body,
  }: CreateProjectRequest): Promise<Either<ProjectOperationError, CreateProjectResponse>> {
    if (!sessionUserId) {
      return left(new ProjectOperationError('É necessário entrar no sistema.', 401))
    }

    const account = await this.users.findActiveAccountById(sessionUserId)
    if (!account || (account.role !== 'admin' && account.role !== 'professor')) {
      return left(
        new ProjectOperationError(
          'Somente professores e administradores podem cadastrar projetos.',
          403,
        ),
      )
    }

    const parsed = parseCreateProjectInput(body)
    if (parsed.isLeft()) {
      return left(new ProjectOperationError(parsed.value.message, 400))
    }
    const input = parsed.value

    const advisorEmail =
      account.role === 'professor' ? account.email.toLowerCase() : input.advisorEmail
    const advisor = await this.users.findActiveAdvisorByEmail(advisorEmail)
    if (!advisor) {
      return left(
        new ProjectOperationError('O professor orientador selecionado não é válido.', 400),
      )
    }

    const students = await this.users.findActiveStudentsByEmails(input.studentEmails)
    if (students.length !== input.studentEmails.length) {
      return left(
        new ProjectOperationError(
          'Um ou mais alunos selecionados não são válidos ou estão inativos.',
          400,
        ),
      )
    }

    const assignmentByEmail = new Map(
      input.teamAssignments.map((assignment) => [assignment.studentEmail, assignment]),
    )
    const teamMembers = students.map((student) => {
      const email = student.email.toLowerCase()
      const assignment = assignmentByEmail.get(email)
      return {
        studentEmail: email,
        name: student.name,
        ...(assignment?.roleTitle ? { roleTitle: assignment.roleTitle } : {}),
        ...(assignment?.isLeader ? { isLeader: true } : {}),
        ...(student.githubUrl ? { githubUrl: student.githubUrl } : {}),
        ...(student.linkedinUrl ? { linkedinUrl: student.linkedinUrl } : {}),
      }
    })

    const id = globalThis.crypto.randomUUID()
    const now = new Date()
    const externalLinks = buildProjectLinks(input)
    const project: ProjectCreateRecord = {
      id,
      title: input.title,
      summary: input.summary,
      cycle: input.cycle,
      semester: input.semester,
      advisorEmail: advisor.email.toLowerCase(),
      advisorName: advisor.name,
      memberEmails: teamMembers.map((member) => member.studentEmail),
      teamMembers,
      languages: input.languages,
      stack: input.stack,
      theme: input.theme,
      status: input.status,
      verified: false,
      publicDetails: {
        overview: input.overview || undefined,
        externalLinks,
        technologyGroups: buildTechnologyGroups(input.languages, input.stack),
      },
      createdByUserId: account.id,
      createdAt: now,
    }

    const tasks: ProjectTaskCreateRecord[] = input.tasks.map((task, index) => ({
      id: globalThis.crypto.randomUUID(),
      projectId: id,
      title: task.title,
      description: task.description,
      versionMajor: index + 1,
      versionMinor: 0,
      status: 'pending',
      targetStudentEmail: task.targetStudentEmail,
      dueDate: task.dueDate,
      createdByUserId: account.id,
      createdAt: now,
      updatedAt: now,
    }))
    const revisions: ProjectRevisionCreateRecord[] = tasks.map((task) => ({
      id: globalThis.crypto.randomUUID(),
      taskId: task.id,
      projectId: id,
      title: task.title,
      description: task.description,
      versionMajor: task.versionMajor,
      versionMinor: task.versionMinor,
      status: task.status,
      targetStudentEmail: task.targetStudentEmail,
      dueDate: task.dueDate,
      action: 'created',
      changeNote: 'Tarefa inicial do projeto',
      changedByUserId: account.id,
      changedAt: now,
    }))

    await this.projects.create(project, tasks, revisions)
    return right({ id, tasksCreated: tasks.length })
  }
}
