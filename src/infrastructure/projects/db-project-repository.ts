import { desc } from 'drizzle-orm'
import { db } from '@/db'
import { projects } from '@/db/schema'
import type { Project } from '@/domain/enterprise/entities/project'
import type { ProjectRepository } from '@/domain/enterprise/repositories/project-repository'
import { MockProjectRepository } from './mock-project-repository'

type ProjectRow = typeof projects.$inferSelect

export function toDomainProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    cycle: row.cycle,
    semester: row.semester,
    advisor: { email: row.advisorEmail, name: row.advisorName },
    memberEmails: row.memberEmails,
    teamMembers: row.teamMembers,
    languages: row.languages,
    stack: row.stack,
    theme: row.theme,
    status: row.status,
    verified: row.verified,
    accessCount: 0,
    cover: {
      icon: 'fi-rr-folder-open',
      label: row.theme,
      tone: row.status === 'publicado' ? 'blue' : 'slate',
    },
    publicDetails: row.publicDetails ?? undefined,
  }
}

export class DbProjectRepository implements ProjectRepository {
  private readonly mock = new MockProjectRepository()

  private async findStored(): Promise<Project[]> {
    try {
      const rows = await db.select().from(projects).orderBy(desc(projects.createdAt))
      return rows.map(toDomainProject)
    } catch (error) {
      console.error('[DbProjectRepository]', error)
      return []
    }
  }

  async findAll(): Promise<Project[]> {
    const [stored, seeded] = await Promise.all([this.findStored(), this.mock.findAll()])
    return [...stored, ...seeded]
  }

  async findById(id: string): Promise<Project | null> {
    const all = await this.findAll()
    return all.find((project) => project.id === id) ?? null
  }
}
