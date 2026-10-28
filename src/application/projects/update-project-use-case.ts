import type { UseCase } from '@/core/application/use-case'
import { type Either, left, right } from '@/core/either'
import type {
  ProjectAdvisor,
  ProjectPublicDetails,
  ProjectStatus,
  ProjectTeamMember,
} from '@/domain/enterprise/entities/project'
import {
  buildProjectLinks,
  buildTechnologyGroups,
} from '@/domain/enterprise/entities/project-details'
import { buildVerificationSummary } from '@/domain/enterprise/entities/project-verification'
import type { ProjectRepository } from '@/domain/enterprise/repositories/project-repository'
import type { ProjectUserDirectory } from '@/domain/enterprise/repositories/project-user-directory'
import type { ProjectVerificationRepository } from '@/domain/enterprise/repositories/project-verification-repository'
import { ProjectOperationError } from './project-operation-error'
import type { ProjectViewer } from './project-permissions'
import { type ProjectEditScope, parseUpdateProjectInput } from './update-project'

interface ExistingProjectForUpdate {
  id: string
  status: ProjectStatus
  advisor: ProjectAdvisor
  coAdvisors?: ProjectAdvisor[] | undefined
  memberEmails: string[]
  publicDetails?: ProjectPublicDetails | null | undefined
}

interface UpdateProjectRequest {
  project: ExistingProjectForUpdate
  viewer: Pick<ProjectViewer, 'role' | 'email'>
  scope: ProjectEditScope
  body: unknown
}

interface ResolvedAdvisors {
  advisor: ProjectAdvisor
  coAdvisors: ProjectAdvisor[]
}

function normalize(email: string) {
  return email.trim().toLowerCase()
}

export class UpdateProjectUseCase
  implements UseCase<UpdateProjectRequest, Either<ProjectOperationError, { id: string }>>
{
  constructor(
    private readonly projects: ProjectRepository,
    private readonly users: ProjectUserDirectory,
    private readonly verifications: ProjectVerificationRepository,
  ) {}

  async execute({
    project,
    viewer,
    scope,
    body,
  }: UpdateProjectRequest): Promise<Either<ProjectOperationError, { id: string }>> {
    const parsed = parseUpdateProjectInput(body, scope)
    if (parsed.isLeft()) {
      return left(new ProjectOperationError(parsed.value.message, 400))
    }
    const input = parsed.value

    const resolvedAdvisors = await this.resolveAdvisors(
      project,
      viewer,
      scope,
      input.advisors.advisorEmail,
      input.advisors.coAdvisorEmails,
    )
    if (resolvedAdvisors.isLeft()) return left(resolvedAdvisors.value)
    const { advisor, coAdvisors } = resolvedAdvisors.value

    const currentDetails = project.publicDetails ?? {}
    const nextStatus = input.scope === 'full' ? input.fields.status : project.status
    const currentEmails = [project.advisor, ...(project.coAdvisors ?? [])].map((item) =>
      normalize(item.email),
    )
    const nextEmails = [advisor, ...coAdvisors].map((item) => normalize(item.email))
    const removedEmails = currentEmails.filter((email) => !nextEmails.includes(email))
    const verified = await this.computeVerified(
      project,
      nextStatus,
      [advisor, ...coAdvisors],
      removedEmails,
    )

    if (input.scope === 'admin') {
      await this.projects.updateAsAdministrator(project.id, {
        advisorEmail: normalize(advisor.email),
        advisorName: advisor.name,
        coAdvisors,
        publicDetails: {
          ...currentDetails,
          externalLinks: buildProjectLinks(input.links),
          ...(input.images ? { images: input.images } : {}),
        },
        verified,
      })
      await this.cleanVerifications(project, nextStatus, removedEmails)
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
      .map(normalize)
      .filter((email) => !fields.studentEmails.includes(email))
    if (
      removed.length > 0 &&
      (await this.projects.hasTasksAssignedToMembers(project.id, removed))
    ) {
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
      coAdvisors,
      memberEmails: teamMembers.map((member) => member.studentEmail ?? ''),
      teamMembers,
      publicDetails: {
        ...currentDetails,
        overview: fields.overview || undefined,
        externalLinks: buildProjectLinks(fields.links),
        ...(fields.images ? { images: fields.images } : {}),
        technologyGroups: buildTechnologyGroups(fields.languages, fields.stack),
      },
      verified,
    })
    await this.cleanVerifications(project, nextStatus, removedEmails)

    return right({ id: project.id })
  }

  private async resolveAdvisors(
    project: ExistingProjectForUpdate,
    viewer: Pick<ProjectViewer, 'role' | 'email'>,
    scope: ProjectEditScope,
    requestedPrincipal: string | null,
    requestedCoAdvisors: string[] | undefined,
  ): Promise<Either<ProjectOperationError, ResolvedAdvisors>> {
    const principalEmail =
      scope === 'admin' && requestedPrincipal
        ? requestedPrincipal
        : normalize(project.advisor.email)
    const coEmails = (
      requestedCoAdvisors ?? (project.coAdvisors ?? []).map((item) => normalize(item.email))
    ).filter((email) => email !== principalEmail)
    const finalEmails = [principalEmail, ...coEmails]

    if (viewer.role === 'professor' && !finalEmails.includes(normalize(viewer.email))) {
      return left(
        new ProjectOperationError(
          'Você não pode se remover da lista de orientadores do projeto.',
          400,
        ),
      )
    }

    const known = new Map(
      [project.advisor, ...(project.coAdvisors ?? [])].map((item) => [normalize(item.email), item]),
    )
    const toLookUp = finalEmails.filter((email) => !known.has(email))
    const people = toLookUp.length ? await this.users.findActiveAdvisorsByEmails(toLookUp) : []
    const lookedUp = new Map(people.map((person) => [person.email.toLowerCase(), person]))
    const invalid = toLookUp.filter((email) => !lookedUp.has(email))
    if (invalid.length > 0) {
      return left(
        new ProjectOperationError(
          `Professores inválidos ou inativos: ${invalid.join(', ')}. Remova-os da lista para salvar.`,
          400,
        ),
      )
    }

    const toAdvisor = (email: string): ProjectAdvisor => {
      const existing = known.get(email)
      if (existing) return { email: normalize(existing.email), name: existing.name }
      return { email, name: lookedUp.get(email)?.name ?? email }
    }

    return right({ advisor: toAdvisor(principalEmail), coAdvisors: coEmails.map(toAdvisor) })
  }

  private async computeVerified(
    project: ExistingProjectForUpdate,
    nextStatus: ProjectStatus,
    advisors: ProjectAdvisor[],
    removedEmails: string[],
  ) {
    if (nextStatus !== 'publicado') return false
    const records = (await this.verifications.findByProject(project.id)).filter(
      (record) => !removedEmails.includes(normalize(record.verifierEmail)),
    )
    return buildVerificationSummary(advisors, records).complete
  }

  private async cleanVerifications(
    project: ExistingProjectForUpdate,
    nextStatus: ProjectStatus,
    removedEmails: string[],
  ) {
    if (project.status === 'publicado' && nextStatus !== 'publicado') {
      await this.verifications.clear(project.id)
      return
    }
    if (removedEmails.length > 0) {
      await this.verifications.removeByEmails(project.id, removedEmails)
    }
  }
}
