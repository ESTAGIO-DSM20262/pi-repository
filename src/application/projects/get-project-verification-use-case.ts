import type { UseCase } from '@/core/application/use-case'
import type { Project } from '@/domain/enterprise/entities/project'
import { getProjectAdvisors } from '@/domain/enterprise/entities/project-advisors'
import {
  buildVerificationSummary,
  type ProjectVerificationSummary,
} from '@/domain/enterprise/entities/project-verification'
import type { ProjectVerificationRepository } from '@/domain/enterprise/repositories/project-verification-repository'

interface GetProjectVerificationRequest {
  project: Pick<Project, 'id' | 'advisor' | 'coAdvisors'>
}

export class GetProjectVerificationUseCase
  implements UseCase<GetProjectVerificationRequest, ProjectVerificationSummary>
{
  constructor(private readonly verifications: ProjectVerificationRepository) {}

  async execute({ project }: GetProjectVerificationRequest) {
    const records = await this.verifications.findByProject(project.id)
    return buildVerificationSummary(getProjectAdvisors(project), records)
  }
}
