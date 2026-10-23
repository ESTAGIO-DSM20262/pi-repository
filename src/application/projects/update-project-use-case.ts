import type { UseCase } from '@/core/application/use-case'
import { type Either, left, right } from '@/core/either'
import type { ProjectPublicDetails, ProjectTeamMember } from '@/domain/enterprise/entities/project'
import type { ProjectRepository } from '@/domain/enterprise/repositories/project-repository'
import type { ProjectUserDirectory } from '@/domain/enterprise/repositories/project-user-directory'
import { buildProjectLinks, buildTechnologyGroups } from '@/domain/enterprise/entities/project-details'
import { parseUpdateProjectInput, type ProjectEditScope } from './update-project'
import { ProjectOperationError } from './project-operation-error'

interface ExistingProjectForUpdate {
  id: string
  memberEmails: string[]
  publicDetails: ProjectPublicDetails | null
}

interface UpdateProjectRequest {
  project: ExistingProjectForUpdate
  scope: ProjectEditScope
  body: unknown
}

export class UpdateProjectUseCase
  implements UseCase<UpdateProjectRequest, Either<ProjectOperationError, { id: string }>>
{
  constructor(
    private readonly projects: ProjectRepository,
    private readonly users: ProjectUserDirectory,
  ) {}

  async execute({ project, scope, body }: UpdateProjectRequest): Promise<
    Either<ProjectOperationError, { id: string }>
  > {
    const parsed = parseUpdateProjectInput(body, scope)
    if (parsed.isLeft()) {
      return left(new ProjectOperationError(parsed.value.message, 400))
    }

    const currentDetails = project.publicDetails ?? {}
    const input = parsed.value
    if (input.scope === 'artifacts') {
      await this.projects.updateArtifacts(project.id, {
        ...currentDetails,
        externalLinks: buildProjectLinks(input.links),
      })
      return right({ id: project.id })
    }

    const fields = input.fields
    const students = await this.users.findActiveStudentsByEmails(fields.studentEmails)
    const found = new Set(students.map((student) => student.email.toLowerCase()))
    const invalid = fields.studentEmails.filter((email) => !found.has(email))
    if (invalid.length > 0) {
      return left(
        new ProjectOperationError(
          `Alunos inválidos ou inativos: ${invalid.join(', ')}. Remova-os do grupo para salvar.`,
          400,
        ),
      )
    }

    const removed = project.memberEmails
      .map((email) => email.trim().toLowerCase())
      .filter((email) => !fields.studentEmails.includes(email))
    if (removed.length > 0 && (await this.projects.hasTasksAssignedToMembers(project.id, removed))) {
      return left(
        new ProjectOperationError(
          'Há tarefas atribuídas a um aluno que foi removido do grupo. Reatribua ou exclua essas tarefas no progresso do projeto antes de removê-lo.',
          409,
        ),
      )
    }

    const byEmail = new Map(students.map((student) => [student.email.toLowerCase(), student]))
    const assignmentByEmail = new Map(
      fields.teamAssignments.map((assignment) => [assignment.studentEmail, assignment]),
    )
    const teamMembers: ProjectTeamMember[] = fields.studentEmails.flatMap((email) => {
      const student = byEmail.get(email)
      if (!student) return []
      const assignment = assignmentByEmail.get(email)
      return [
        {
          studentEmail: email,
          name: student.name,
          ...(assignment?.roleTitle ? { roleTitle: assignment.roleTitle } : {}),
          ...(assignment?.isLeader ? { isLeader: true } : {}),
          ...(student.githubUrl ? { githubUrl: student.githubUrl } : {}),
          ...(student.linkedinUrl ? { linkedinUrl: student.linkedinUrl } : {}),
        },
      ]
    })

    await this.projects.update(project.id, {
      title: fields.title,
      summary: fields.summary,
      cycle: fields.cycle,
      semester: fields.semester,
      theme: fields.theme,
      status: fields.status,
      languages: fields.languages,
      stack: fields.stack,
      memberEmails: teamMembers.map((member) => member.studentEmail ?? ''),
      teamMembers,
      publicDetails: {
        ...currentDetails,
        overview: fields.overview || undefined,
        externalLinks: buildProjectLinks(fields),
        technologyGroups: buildTechnologyGroups(fields.languages, fields.stack),
      },
    })

    return right({ id: project.id })
  }
}
