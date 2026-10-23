import { and, eq } from 'drizzle-orm'
import type { ProjectEditScope } from '@/application/projects/update-project'
import { db } from '@/db'
import { projects, users } from '@/db/schema'

export type StoredProject = typeof projects.$inferSelect

export type ProjectEditAccess =
  | {
      ok: true
      project: StoredProject
      scope: ProjectEditScope
      user: { id: string; email: string; name: string; role: 'professor' | 'admin' }
    }
  | { ok: false; status: number; message: string }

export async function resolveProjectEditAccess({
  sessionUserId,
  projectId,
}: {
  sessionUserId: string
  projectId: string
}): Promise<ProjectEditAccess> {
  if (!sessionUserId) {
    return { ok: false, status: 401, message: 'É necessário entrar no sistema.' }
  }

  const [account] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(and(eq(users.id, sessionUserId), eq(users.active, true)))
    .limit(1)

  if (!account || (account.role !== 'professor' && account.role !== 'admin')) {
    return {
      ok: false,
      status: 403,
      message: 'Somente o professor orientador ou um administrador podem editar o projeto.',
    }
  }

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!project) {
    return {
      ok: false,
      status: 404,
      message: 'Projeto não encontrado. Projetos demonstrativos do acervo não podem ser editados.',
    }
  }

  const email = account.email.trim().toLowerCase()
  const user = { id: account.id, email, name: account.name, role: account.role }

  if (account.role === 'admin') return { ok: true, project, scope: 'artifacts', user }

  if (project.advisorEmail.trim().toLowerCase() !== email) {
    return {
      ok: false,
      status: 403,
      message: 'Somente o professor orientador deste projeto pode editá-lo.',
    }
  }

  return { ok: true, project, scope: 'full', user }
}
