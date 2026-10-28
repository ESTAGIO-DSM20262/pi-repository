import type { UseCase } from '@/core/application/use-case'
import { type Either, left, right } from '@/core/either'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'
import type { ProjectRepository } from '@/domain/enterprise/repositories/project-repository'
import { ProjectOperationError } from './project-operation-error'
import { canManageActivation, type ProjectViewer } from './project-permissions'

interface SetProjectActivationRequest {
  viewer: Pick<ProjectViewer, 'role'>
  projectId: string
  active: boolean
}

export class SetProjectActivationUseCase
  implements
    UseCase<
      SetProjectActivationRequest,
      Either<ProjectOperationError, { id: string; active: boolean }>
    >
{
  constructor(
    private readonly reader: ProjectReader,
    private readonly projects: ProjectRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute({
    viewer,
    projectId,
    active,
  }: SetProjectActivationRequest): Promise<
    Either<ProjectOperationError, { id: string; active: boolean }>
  > {
    if (!canManageActivation(viewer)) {
      return left(
        new ProjectOperationError(
          'Somente administradores podem ativar ou desativar projetos.',
          403,
        ),
      )
    }
    const project = await this.reader.findById(projectId)
    if (!project) {
      return left(
        new ProjectOperationError(
          'Projeto não encontrado. Projetos demonstrativos do acervo não podem ser desativados.',
          404,
        ),
      )
    }
    await this.projects.setActive(projectId, active, this.now())
    return right({ id: projectId, active })
  }
}
