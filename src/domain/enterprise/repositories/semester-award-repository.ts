import type { Project } from '@/domain/enterprise/entities/project'

export interface SemesterAwardRepository {
  choose(project: Project, userId: string, expectedWinnerId: string | null): Promise<boolean>
  remove(project: Project): Promise<boolean>
}
