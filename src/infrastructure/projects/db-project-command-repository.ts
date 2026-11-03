import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  projectFavorites,
  projectProgressRevisions,
  projectProgressTasks,
  projects,
} from '@/db/schema'
import type {
  ProjectAdministrationUpdateRecord,
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

  async updateAsAdministrator(
    id: string,
    record: ProjectAdministrationUpdateRecord,
  ): Promise<void> {
    await db.update(projects).set(record).where(eq(projects.id, id))
  }

  async setActive(id: string, active: boolean, changedAt: Date): Promise<void> {
    await db
      .update(projects)
      .set({ active, deactivatedAt: active ? null : changedAt })
      .where(eq(projects.id, id))
  }

  async delete(id: string): Promise<void> {
    await db.batch([
      db.delete(projectProgressRevisions).where(eq(projectProgressRevisions.projectId, id)),
      db.delete(projectProgressTasks).where(eq(projectProgressTasks.projectId, id)),
      db.delete(projectFavorites).where(eq(projectFavorites.projectId, id)),
      db.delete(projects).where(eq(projects.id, id)),
    ])
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
