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

const DASHBOARD_TIME_ZONE = 'America/Sao_Paulo'

function currentMonthIn(timeZone: string, now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  return { year, month }
}

function monthKey(year: number, monthIndex: number) {
  const date = new Date(Date.UTC(year, monthIndex, 1))
  return {
    key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
    monthIndex: date.getUTCMonth(),
  }
}

export async function loadRegistrationsByMonth(
  months = 6,
  now = new Date(),
): Promise<MonthlyRegistration[]> {
  const current = currentMonthIn(DASHBOARD_TIME_ZONE, now)
  const window = Array.from({ length: months }, (_, index) =>
    monthKey(current.year, current.month - months + index),
  )
  const startKey = window[0]?.key ?? ''
  const localMonth = sql<string>`to_char((${users.createdAt} AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')`

  const rows = await db
    .select({ key: localMonth, count: sql<number>`count(*)`.mapWith(Number) })
    .from(users)
    .where(sql`${localMonth} >= ${startKey}`)
    .groupBy(localMonth)

  const counts = new Map(rows.map((row) => [row.key, row.count]))

  return window.map(({ key, monthIndex }) => ({
    key,
    label: MONTH_LABELS[monthIndex] ?? key,
    count: counts.get(key) ?? 0,
  }))
}
