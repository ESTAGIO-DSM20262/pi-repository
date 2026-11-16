import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { semesterAwards } from '@/db/schema'
import type { Project } from '@/domain/enterprise/entities/project'
import type { SemesterAwardRepository } from '@/domain/enterprise/repositories/semester-award-repository'

export class DbSemesterAwardRepository implements SemesterAwardRepository {
  async choose(project: Project, userId: string, expectedWinnerId: string | null) {
    const selected = await db
      .insert(semesterAwards)
      .values({
        cycle: project.cycle,
        semester: project.semester,
        projectId: project.id,
        selectedByUserId: userId,
        selectedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [semesterAwards.cycle, semesterAwards.semester],
        set: { projectId: project.id, selectedByUserId: userId, selectedAt: new Date() },
        setWhere:
          expectedWinnerId === null ? sql`false` : eq(semesterAwards.projectId, expectedWinnerId),
      })
      .returning({ projectId: semesterAwards.projectId })
    return selected.length === 1
  }

  async remove(project: Project) {
    const removed = await db
      .delete(semesterAwards)
      .where(
        and(
          eq(semesterAwards.projectId, project.id),
          eq(semesterAwards.cycle, project.cycle),
          eq(semesterAwards.semester, project.semester),
        ),
      )
      .returning({ projectId: semesterAwards.projectId })
    return removed.length === 1
  }
}
