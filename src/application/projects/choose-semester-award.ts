import { type Either, left, right } from '@/core/either'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'
import type { SemesterAwardRepository } from '@/domain/enterprise/repositories/semester-award-repository'
import { ProjectOperationError } from './project-operation-error'
import type { ProjectViewer } from './project-permissions'
import { canChooseSemesterAward, isAwardEligible } from './semester-awards'

export class ChooseSemesterAward {
  constructor(
    private readonly reader: ProjectReader,
    private readonly awards: SemesterAwardRepository,
  ) {}

  async execute(input: {
    viewer: ProjectViewer
    projectId: string
    remove?: boolean
    expectedWinnerId: string | null
  }): Promise<Either<ProjectOperationError, { success: boolean }>> {
    const project = await this.reader.findById(input.projectId)
    if (!project) return left(new ProjectOperationError('Projeto não encontrado.', 404))
    if (!canChooseSemesterAward(project, input.viewer)) {
      return left(
        new ProjectOperationError(
          'Somente o orientador principal deste projeto ou um administrador pode definir o melhor PI.',
          403,
        ),
      )
    }
    if (!input.remove && !isAwardEligible(project)) {
      return left(
        new ProjectOperationError(
          'Somente projetos concluídos e ativos podem ser escolhidos.',
          409,
        ),
      )
    }
    const saved = input.remove
      ? await this.awards.remove(project)
      : await this.awards.choose(project, input.viewer.id, input.expectedWinnerId)
    if (!saved)
      return left(
        new ProjectOperationError(
          'A escolha ou o projeto foi alterado. Atualize a lista e tente novamente.',
          409,
        ),
      )
    return right({ success: true })
  }
}
