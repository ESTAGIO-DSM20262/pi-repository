import { and, eq, inArray, sql } from 'drizzle-orm'
import type { DashboardTask, MonthlyRegistration } from '@/application/dashboard/dashboard-metrics'
import { db } from '@/db'
import { projectProgressTasks, projectVerifications, users } from '@/db/schema'

export async function loadProgressTasks(projectIds?: string[]): Promise<DashboardTask[]> {
  if (projectIds && projectIds.length === 0) return []

  const rows = await db
    .select({
      id: projectProgressTasks.id,
      projectId: projectProgressTasks.projectId,
      title: projectProgressTasks.title,
      versionMajor: projectProgressTasks.versionMajor,
      versionMinor: projectProgressTasks.versionMinor,
      status: projectProgressTasks.status,
      targetStudentEmail: projectProgressTasks.targetStudentEmail,
      dueDate: projectProgressTasks.dueDate,
      updatedAt: projectProgressTasks.updatedAt,
    })
    .from(projectProgressTasks)
    .where(projectIds ? inArray(projectProgressTasks.projectId, projectIds) : undefined)

  return rows.map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString() }))
}

export async function loadIndicatedProjectIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ projectId: projectVerifications.projectId })
    .from(projectVerifications)
    .where(eq(projectVerifications.verifierUserId, userId))

  return rows.map((row) => row.projectId)
}

export async function loadActivePeople() {
  const rows = await db
    .select({ email: users.email, role: users.role })
    .from(users)
    .where(and(eq(users.active, true), inArray(users.role, ['student', 'professor'])))

  return {
    students: rows.filter((row) => row.role === 'student').map((row) => row.email),
    professors: rows.filter((row) => row.role === 'professor').map((row) => row.email),
  }
}

const MONTH_LABELS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

export async function loadRegistrationsByMonth(months = 6): Promise<MonthlyRegistration[]> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

  const rows = await db
    .select({
      key: sql<string>`to_char(${users.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(users)
    .where(sql`${users.createdAt} >= ${start}`)
    .groupBy(sql`to_char(${users.createdAt}, 'YYYY-MM')`)

  const counts = new Map(rows.map((row) => [row.key, row.count]))

  return Array.from({ length: months }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return { key, label: MONTH_LABELS[date.getMonth()] ?? key, count: counts.get(key) ?? 0 }
  })
}
