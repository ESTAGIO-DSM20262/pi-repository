import type { UseCase } from '@/core/application/use-case'
import { type Either, left, right } from '@/core/either'
import { getProjectAdvisors } from '@/domain/enterprise/entities/project-advisors'
import {
  buildVerificationSummary,
  type ProjectVerificationSummary,
} from '@/domain/enterprise/entities/project-verification'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'
import type { ProjectVerificationRepository } from '@/domain/enterprise/repositories/project-verification-repository'
import { ProjectOperationError } from './project-operation-error'
import { canVerifyProject, type ProjectViewer } from './project-permissions'

interface RemoveProjectVerificationRequest {
  viewer: ProjectViewer
  projectId: string
}

type RemoveProjectVerificationResponse = Either<
  ProjectOperationError,
  { summary: ProjectVerificationSummary }
>

export class RemoveProjectVerificationUseCase
  implements UseCase<RemoveProjectVerificationRequest, RemoveProjectVerificationResponse>
{
  constructor(
    private readonly reader: ProjectReader,
    private readonly verifications: ProjectVerificationRepository,
  ) {}

  async execute({
    viewer,
    projectId,
  }: RemoveProjectVerificationRequest): Promise<RemoveProjectVerificationResponse> {
    const project = await this.reader.findById(projectId)
    if (!project || (project.active === false && viewer.role !== 'admin')) {
      return left(new ProjectOperationError('Projeto não encontrado.', 404))
    }
    if (!canVerifyProject(project, viewer)) {
      return left(
        new ProjectOperationError(
          'Somente os professores orientadores ou um administrador podem remover a indicação deste projeto.',
          403,
        ),
      )
    }

    const existing = await this.verifications.findByProject(projectId)
    if (!existing.some((item) => item.verifierUserId === viewer.id)) {
      return left(new ProjectOperationError('Você ainda não indicou este projeto.', 404))
    }

    const remaining = existing.filter((item) => item.verifierUserId !== viewer.id)
    const summary = buildVerificationSummary(getProjectAdvisors(project), remaining)

    await this.verifications.removeByUser(projectId, viewer.id, summary.complete)
    return right({ summary })
  }
}
