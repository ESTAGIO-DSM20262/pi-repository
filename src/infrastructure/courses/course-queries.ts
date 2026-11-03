import { asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { courses, users } from '@/db/schema'

export interface CourseWithUsage {
  id: string
  name: string
  abbreviation: string | null
  active: boolean
  userCount: number
}

export async function listCourses(): Promise<CourseWithUsage[]> {
  return db
    .select({
      id: courses.id,
      name: courses.name,
      abbreviation: courses.abbreviation,
      active: courses.active,
      userCount: sql<number>`(SELECT count(*) FROM ${users} WHERE ${users.course} = ${courses.name})`
        .mapWith(Number)
        .as('user_count'),
    })
    .from(courses)
    .orderBy(asc(sql`lower(${courses.name})`))
}

/** Sigla do curso pelo nome salvo no usuário. Nunca falha: sem a tabela ou o curso, devolve null. */
export async function findCourseAbbreviation(name: string | null): Promise<string | null> {
  if (!name) return null
  try {
    const [row] = await db
      .select({ abbreviation: courses.abbreviation })
      .from(courses)
      .where(eq(courses.name, name))
      .limit(1)
    return row?.abbreviation ?? null
  } catch {
    return null
  }
}
