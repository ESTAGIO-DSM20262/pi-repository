import type { UseCase } from '@/core/application/use-case'
import { type Either, left, right } from '@/core/either'
import { isProjectActive } from '@/domain/enterprise/entities/project-advisors'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'
import type { ProjectRepository } from '@/domain/enterprise/repositories/project-repository'
import { ProjectOperationError } from './project-operation-error'
import { canManageActivation, type ProjectViewer } from './project-permissions'

interface DeleteProjectRequest {
  viewer: Pick<ProjectViewer, 'role'>
  projectId: string
}

export class DeleteProjectUseCase
  implements UseCase<DeleteProjectRequest, Either<ProjectOperationError, { id: string }>>
{
  constructor(
    private readonly reader: ProjectReader,
    private readonly projects: ProjectRepository,
  ) {}

  async execute({
    viewer,
    projectId,
  }: DeleteProjectRequest): Promise<Either<ProjectOperationError, { id: string }>> {
    if (!canManageActivation(viewer)) {
      return left(new ProjectOperationError('Somente administradores podem excluir projetos.', 403))
    }
    const project = await this.reader.findById(projectId)
    if (!project) {
      return left(
        new ProjectOperationError(
          'Projeto não encontrado. Projetos demonstrativos do acervo não podem ser excluídos.',
          404,
        ),
      )
    }
    if (isProjectActive(project)) {
      return left(
        new ProjectOperationError('Desative o projeto antes de excluí-lo definitivamente.', 409),
      )
    }
    await this.projects.delete(projectId)
    return right({ id: projectId })
  }
}
