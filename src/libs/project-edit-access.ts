import { resolveProjectEditScope } from '@/application/projects/project-permissions'
import type { ProjectEditScope } from '@/application/projects/update-project'
import type { Project } from '@/domain/enterprise/entities/project'
import { isProjectActive } from '@/domain/enterprise/entities/project-advisors'
import { DbProjectRepository } from '@/infrastructure/projects/db-project-repository'
import { DbProjectUserDirectory } from '@/infrastructure/projects/db-project-user-directory'

export type ProjectEditAccess =
  | {
      ok: true
      project: Project
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

  const account = await new DbProjectUserDirectory().findActiveAccountById(sessionUserId)
  if (!account || (account.role !== 'professor' && account.role !== 'admin')) {
    return {
      ok: false,
      status: 403,
      message: 'Somente os professores orientadores ou um administrador podem editar o projeto.',
    }
  }

  const project = await new DbProjectRepository().findById(projectId)
  if (!project || (!isProjectActive(project) && account.role !== 'admin')) {
    return {
      ok: false,
      status: 404,
      message: 'Projeto não encontrado. Projetos demonstrativos do acervo não podem ser editados.',
    }
  }

  const user = {
    id: account.id,
    email: account.email.trim().toLowerCase(),
    name: account.name,
    role: account.role,
  }
  const scope = resolveProjectEditScope(project, user)
  if (!scope) {
    return {
      ok: false,
      status: 403,
      message: 'Somente os professores orientadores deste projeto podem editá-lo.',
    }
  }

  return { ok: true, project, scope, user }
}
