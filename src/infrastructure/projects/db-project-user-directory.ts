import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import type {
  ProjectDirectoryAccount,
  ProjectDirectoryPerson,
  ProjectUserDirectory,
} from '@/domain/enterprise/repositories/project-user-directory'

export class DbProjectUserDirectory implements ProjectUserDirectory {
  async findActiveAccountById(id: string): Promise<ProjectDirectoryAccount | null> {
    const [account] = await db
      .select({ id: users.id, email: users.email, name: users.name, role: users.role })
      .from(users)
      .where(and(eq(users.id, id), eq(users.active, true)))
      .limit(1)

    return account ?? null
  }

  async findActiveAdvisorsByEmails(emails: string[]): Promise<ProjectDirectoryPerson[]> {
    const normalizedEmails = [...new Set(emails.map((email) => email.trim().toLowerCase()))]
    if (normalizedEmails.length === 0) return []

    return db
      .select({
        email: users.email,
        name: users.name,
        githubUrl: users.githubUrl,
        linkedinUrl: users.linkedinUrl,
      })
      .from(users)
      .where(
        and(
          inArray(sql<string>`lower(${users.email})`, normalizedEmails),
          eq(users.role, 'professor'),
          eq(users.active, true),
        ),
      )
  }

  async findActiveStudentsByEmails(emails: string[]): Promise<ProjectDirectoryPerson[]> {
    const normalizedEmails = [...new Set(emails.map((email) => email.trim().toLowerCase()))]
    if (normalizedEmails.length === 0) return []

    return db
      .select({
        email: users.email,
        name: users.name,
        githubUrl: users.githubUrl,
        linkedinUrl: users.linkedinUrl,
      })
      .from(users)
      .where(
        and(
          inArray(sql<string>`lower(${users.email})`, normalizedEmails),
          eq(users.role, 'student'),
          eq(users.active, true),
        ),
      )
  }
}
