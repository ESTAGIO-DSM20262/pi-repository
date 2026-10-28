import { eq } from 'drizzle-orm'
import {
  canManageProgress,
  isAdvisorOf,
  isMemberOf,
} from '@/application/projects/project-permissions'
import { db } from '@/db'
import { users } from '@/db/schema'
import type { Project } from '@/domain/enterprise/entities/project'
import { isProjectActive } from '@/domain/enterprise/entities/project-advisors'
import { CompositeProjectRepository } from '@/infrastructure/projects/composite-project-repository'
import { auth } from '@/libs/auth'

export type ProgressAccess =
  | {
      ok: true
      project: Project
      user: { id: string; email: string; name: string; role: 'student' | 'professor' | 'admin' }
      canManage: boolean
      canViewAllTasks: boolean
    }
  | {
      ok: false
      status: number
      message: string
    }

export async function resolveProjectProgressAccess(
  request: Request,
  projectId: string,
): Promise<ProgressAccess> {
  const project = await new CompositeProjectRepository().findById(projectId)
  if (!project) {
    return { ok: false, status: 404, message: 'O projeto não foi encontrado.' }
  }

  const session = await auth.api.getSession({ headers: request.headers })
  const sessionUserId = session?.user?.id ? String(session.user.id) : ''
  if (!sessionUserId) {
    return {
      ok: false,
      status: 401,
      message: 'Entre no sistema para consultar o progresso do projeto.',
    }
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      active: users.active,
    })
    .from(users)
    .where(eq(users.id, sessionUserId))
    .limit(1)

  if (!user?.active) {
    return { ok: false, status: 403, message: 'Esta conta não tem acesso ao progresso do projeto.' }
  }

  const email = user.email.trim().toLowerCase()
  const viewer = { email, role: user.role }
  const isAdmin = user.role === 'admin'
  const isAdvisor = isAdvisorOf(project, viewer)
  const isMember = isMemberOf(project, viewer)

  if (!isAdmin && (!isProjectActive(project) || (!isAdvisor && !isMember))) {
    return { ok: false, status: 404, message: 'O projeto não foi encontrado.' }
  }

  const canViewAllTasks = isAdmin || isAdvisor
  const canManage = canManageProgress(project, viewer)

  return {
    ok: true,
    project,
    user: { id: user.id, email, name: user.name, role: user.role },
    canManage,
    canViewAllTasks,
  }
}
