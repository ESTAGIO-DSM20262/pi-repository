import type { UseCase } from '@/core/application/use-case'
import { type Either, left, right } from '@/core/either'
import { getProjectAdvisors } from '@/domain/enterprise/entities/project-advisors'
import {
  buildVerificationSummary,
  normalizeVerificationCriteria,
  type ProjectVerificationRecord,
  type ProjectVerificationSummary,
} from '@/domain/enterprise/entities/project-verification'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'
import type { ProjectVerificationRepository } from '@/domain/enterprise/repositories/project-verification-repository'
import { ProjectOperationError } from './project-operation-error'
import { canVerifyProject, type ProjectViewer } from './project-permissions'

interface VerifyProjectRequest {
  viewer: ProjectViewer
  projectId: string
  body: unknown
}

export class VerifyProjectUseCase
  implements
    UseCase<
      VerifyProjectRequest,
      Either<ProjectOperationError, { summary: ProjectVerificationSummary }>
    >
{
  constructor(
    private readonly reader: ProjectReader,
    private readonly verifications: ProjectVerificationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute({
    viewer,
    projectId,
    body,
  }: VerifyProjectRequest): Promise<
    Either<ProjectOperationError, { summary: ProjectVerificationSummary }>
  > {
    const project = await this.reader.findById(projectId)
    if (!project || (project.active === false && viewer.role !== 'admin')) {
      return left(
        new ProjectOperationError(
          'Projeto não encontrado. Projetos demonstrativos do acervo não podem ser indicados.',
          404,
        ),
      )
    }
    if (project.status !== 'publicado') {
      return left(
        new ProjectOperationError('Somente projetos concluídos podem ser indicados.', 409),
      )
    }
    if (!canVerifyProject(project, viewer)) {
      return left(
        new ProjectOperationError(
          'Somente os professores orientadores ou um administrador podem indicar este projeto.',
          403,
        ),
      )
    }

    const data = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
    const criteria = normalizeVerificationCriteria(data.criteria)
    if (criteria.length === 0) {
      return left(
        new ProjectOperationError('Marque ao menos um critério para indicar o projeto.', 400),
      )
    }

    const record: ProjectVerificationRecord = {
      verifierUserId: viewer.id,
      verifierEmail: viewer.email.trim().toLowerCase(),
      verifierName: viewer.name,
      verifierRole: viewer.role === 'admin' ? 'admin' : 'professor',
      criteria,
      verifiedAt: this.now().toISOString(),
    }
    const existing = await this.verifications.findByProject(projectId)
    const records = [...existing.filter((item) => item.verifierUserId !== viewer.id), record]
    const summary = buildVerificationSummary(getProjectAdvisors(project), records)

    await this.verifications.save(projectId, record, summary.complete)
    return right({ summary })
  }
}
