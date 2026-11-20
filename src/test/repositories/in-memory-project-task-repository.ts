import type {
  ProjectRevisionCreateRecord,
  ProjectTaskCreateRecord,
} from '@/domain/enterprise/repositories/project-repository'
import type { ProjectTaskRepository } from '@/domain/enterprise/repositories/project-task-repository'

export class InMemoryProjectTaskRepository implements ProjectTaskRepository {
  readonly tasks: ProjectTaskCreateRecord[] = []
  readonly revisions: ProjectRevisionCreateRecord[] = []

  async latestVersionMajors(projectIds: string[]) {
    const latest = new Map<string, number>()
    for (const task of this.tasks) {
      if (!projectIds.includes(task.projectId)) continue
      latest.set(task.projectId, Math.max(latest.get(task.projectId) ?? 0, task.versionMajor))
    }
    return latest
  }

  async createMany(tasks: ProjectTaskCreateRecord[], revisions: ProjectRevisionCreateRecord[]) {
    this.tasks.push(...tasks)
    this.revisions.push(...revisions)
  }
}
