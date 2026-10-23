import { and, asc, eq } from 'drizzle-orm'
import type { Role } from '@/domain/enterprise/entities/role'
import { db } from '@/db'
import { users } from '@/db/schema'
import type { ProjectPersonOption } from '@/presentation/projects/project-person'

export async function listActiveProjectPeople(role: Role): Promise<ProjectPersonOption[]> {
  const rows = await db
    .select({
      email: users.email,
      name: users.name,
      registrationNumber: users.registrationNumber,
      course: users.course,
    })
    .from(users)
    .where(and(eq(users.role, role), eq(users.active, true)))
    .orderBy(asc(users.name))

  return rows.map((row) => ({
    email: row.email.toLowerCase(),
    name: row.name,
    registrationNumber: row.registrationNumber,
    course: row.course,
  }))
}
