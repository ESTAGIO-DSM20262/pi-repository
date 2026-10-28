import type { ProjectViewer } from '@/application/projects/project-permissions'
import { DbProjectUserDirectory } from '@/infrastructure/projects/db-project-user-directory'
import { auth } from '@/libs/auth'

export async function resolveProjectViewer(request: Request): Promise<ProjectViewer | null> {
  const session = await auth.api.getSession({ headers: request.headers })
  const sessionUserId = session?.user?.id ? String(session.user.id) : ''
  if (!sessionUserId) return null

  const account = await new DbProjectUserDirectory().findActiveAccountById(sessionUserId)
  if (!account) return null

  return {
    id: account.id,
    email: account.email.trim().toLowerCase(),
    name: account.name,
    role: account.role,
  }
}
