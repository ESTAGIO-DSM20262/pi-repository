import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { projects } from '@/db/schema'
import type { Project } from '@/domain/enterprise/entities/project'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'

type ProjectRow = typeof projects.$inferSelect

export function toDomainProject(row: ProjectRow): Project {
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

export class DbProjectRepository implements ProjectReader {
  async findAll(): Promise<Project[]> {
    const rows = await db.select().from(projects).orderBy(desc(projects.createdAt))
    return rows.map(toDomainProject)
  }

  async findById(id: string): Promise<Project | null> {
    const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    return row ? toDomainProject(row) : null
  }
}
