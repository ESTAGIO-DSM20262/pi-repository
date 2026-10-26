import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import { projectProgressRevisions, projectProgressTasks, projects } from '@/db/schema'
import type { ProjectPublicDetails } from '@/domain/enterprise/entities/project'
import type {
  ProjectCreateRecord,
  ProjectFullUpdateRecord,
  ProjectRepository,
  ProjectRevisionCreateRecord,
  ProjectTaskCreateRecord,
} from '@/domain/enterprise/repositories/project-repository'

export class DbProjectCommandRepository implements ProjectRepository {
  async create(
    project: ProjectCreateRecord,
    tasks: ProjectTaskCreateRecord[],
    revisions: ProjectRevisionCreateRecord[],
  ): Promise<void> {
    const projectInsert = db.insert(projects).values(project)
    if (tasks.length === 0) {
      await projectInsert
      return
    }

    await db.batch([
      projectInsert,
      db.insert(projectProgressTasks).values(tasks),
      db.insert(projectProgressRevisions).values(revisions),
    ])
  }

  async update(id: string, record: ProjectFullUpdateRecord): Promise<void> {
    await db.update(projects).set(record).where(eq(projects.id, id))
  }

  async updateArtifacts(id: string, publicDetails: ProjectPublicDetails): Promise<void> {
    await db.update(projects).set({ publicDetails }).where(eq(projects.id, id))
  }

  async hasTasksAssignedToMembers(projectId: string, memberEmails: string[]): Promise<boolean> {
    if (memberEmails.length === 0) return false
    const [task] = await db
      .select({ id: projectProgressTasks.id })
      .from(projectProgressTasks)
      .where(
        and(
          eq(projectProgressTasks.projectId, projectId),
          inArray(sql<string>`lower(${projectProgressTasks.targetStudentEmail})`, memberEmails),
        ),
      )
      .limit(1)
    return Boolean(task)
  }
}
