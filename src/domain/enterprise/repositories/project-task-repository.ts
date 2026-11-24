import type {
  ProjectRevisionCreateRecord,
  ProjectTaskCreateRecord,
} from '@/domain/enterprise/repositories/project-repository'

export interface ProjectTaskRepository {
  latestVersionMajors(projectIds: string[]): Promise<Map<string, number>>
  createMany(
    tasks: ProjectTaskCreateRecord[],
    revisions: ProjectRevisionCreateRecord[],
  ): Promise<void>
}
