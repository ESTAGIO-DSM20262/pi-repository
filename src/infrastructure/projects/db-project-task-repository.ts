import { inArray, max } from 'drizzle-orm'
import { db } from '@/db'
import { projectProgressRevisions, projectProgressTasks } from '@/db/schema'
import type {
  ProjectRevisionCreateRecord,
  ProjectTaskCreateRecord,
} from '@/domain/enterprise/repositories/project-repository'
import type { ProjectTaskRepository } from '@/domain/enterprise/repositories/project-task-repository'

export class DbProjectTaskRepository implements ProjectTaskRepository {
  async latestVersionMajors(projectIds: string[]) {
    if (projectIds.length === 0) return new Map<string, number>()
    const rows = await db
      .select({
        projectId: projectProgressTasks.projectId,
        latest: max(projectProgressTasks.versionMajor),
      })
      .from(projectProgressTasks)
      .where(inArray(projectProgressTasks.projectId, projectIds))
      .groupBy(projectProgressTasks.projectId)
    return new Map(rows.map((row) => [row.projectId, row.latest ?? 0]))
  }

  async createMany(tasks: ProjectTaskCreateRecord[], revisions: ProjectRevisionCreateRecord[]) {
    if (tasks.length === 0) return
    await db.batch([
      db.insert(projectProgressTasks).values(tasks),
      db.insert(projectProgressRevisions).values(revisions),
    ])
  }
}
