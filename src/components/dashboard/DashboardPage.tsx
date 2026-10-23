import { sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ListProjectsUseCase } from '@/application/projects/list-projects'
import { db } from '@/db'
import { users } from '@/db/schema'
import type { Role } from '@/domain/enterprise/entities/role'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { CompositeProjectRepository } from '@/infrastructure/projects/composite-project-repository'
import { auth } from '@/libs/auth'
import { ROLE_DASHBOARD_PATH } from '@/presentation/auth/role-path'
import { type AdminUserMetrics, RoleDashboard } from './RoleDashboard'

export async function DashboardPage({ requiredRole }: { requiredRole: Role }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/login')

  const user = toDomainUser(session.user)
  if (!user) redirect('/login')
  if (user.role !== requiredRole) redirect(ROLE_DASHBOARD_PATH[user.role])

  const useCase = new ListProjectsUseCase(new CompositeProjectRepository())
  const { projects } = await useCase.execute({
    viewer: { email: user.emailAddress, role: user.role },
  })

  let adminUserMetrics: AdminUserMetrics | undefined
  if (user.role === 'admin') {
    try {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const [metrics] = await db
        .select({
          total: sql<number>`count(*)`.mapWith(Number),
          active: sql<number>`count(*) filter (where ${users.active} = true)`.mapWith(Number),
          inactive: sql<number>`count(*) filter (where ${users.active} = false)`.mapWith(Number),
          verifiedEmails:
            sql<number>`count(*) filter (where ${users.emailVerified} = true)`.mapWith(Number),
          newThisMonth:
            sql<number>`count(*) filter (where ${users.createdAt} >= ${monthStart})`.mapWith(
              Number,
            ),
          students: sql<number>`count(*) filter (where ${users.role} = 'student')`.mapWith(Number),
          professors: sql<number>`count(*) filter (where ${users.role} = 'professor')`.mapWith(
            Number,
          ),
          admins: sql<number>`count(*) filter (where ${users.role} = 'admin')`.mapWith(Number),
        })
        .from(users)

      adminUserMetrics = metrics
    } catch (error) {
      console.error('[Admin dashboard metrics]', error)
    }
  }

  return (
    <RoleDashboard
      currentUserId={String(session.user.id)}
      name={user.name}
      email={user.emailAddress}
      role={user.role}
      projects={projects}
      adminUserMetrics={adminUserMetrics}
    />
  )
}
