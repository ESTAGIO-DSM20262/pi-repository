import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { projects, semesterAwards } from '@/db/schema'
import type { Project } from '@/domain/enterprise/entities/project'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'

type ProjectRow = typeof projects.$inferSelect

export function toDomainProject(row: ProjectRow, bestOfSemester = false): Project {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    cycle: row.cycle,
    semester: row.semester,
    advisor: { email: row.advisorEmail, name: row.advisorName },
    coAdvisors: row.coAdvisors,
    memberEmails: row.memberEmails,
    teamMembers: row.teamMembers,
    languages: row.languages,
    stack: row.stack,
    theme: row.theme,
    status: row.status,
    verified: row.verified,
    bestOfSemester,
    active: row.active,
    accessCount: 0,
    cover: {
      icon: 'fi-rr-folder-open',
      label: row.theme,
      tone: row.status === 'publicado' ? 'blue' : 'slate',
    },
    publicDetails: row.publicDetails ?? undefined,
  }
}

async function loadAwardedProjectIds() {
  try {
    const rows = await db.select({ projectId: semesterAwards.projectId }).from(semesterAwards)
    return new Set(rows.map((row) => row.projectId))
  } catch (error) {
    console.error('[Melhor PI do semestre]', error)
    return new Set<string>()
  }
}

export class DbProjectRepository implements ProjectReader {
  async findAll(): Promise<Project[]> {
    const [rows, awarded] = await Promise.all([
      db.select().from(projects).orderBy(desc(projects.createdAt)),
      loadAwardedProjectIds(),
    ])
    return rows.map((row) => toDomainProject(row, awarded.has(row.id)))
  }

  async findById(id: string): Promise<Project | null> {
    const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    if (!row) return null
    const awarded = await loadAwardedProjectIds()
    return toDomainProject(row, awarded.has(row.id))
  }
}
