import { NextResponse } from 'next/server'
import { UpdateProjectUseCase } from '@/application/projects/update-project-use-case'
import type { ProjectPublicDetails } from '@/domain/enterprise/entities/project'
import { DbProjectCommandRepository } from '@/infrastructure/projects/db-project-command-repository'
import { DbProjectUserDirectory } from '@/infrastructure/projects/db-project-user-directory'
import { auth } from '@/libs/auth'
import { resolveProjectEditAccess } from '@/libs/project-edit-access'

interface RouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    const sessionUserId = session?.user?.id ? String(session.user.id) : ''
    const access = await resolveProjectEditAccess({ sessionUserId, projectId: id })
    if (!access.ok) return jsonError(access.message, access.status)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError('Envie os dados do projeto em formato JSON.', 400)
    }

    const currentProject = {
      id: access.project.id,
      memberEmails: access.project.memberEmails,
      publicDetails: access.project.publicDetails as ProjectPublicDetails | null,
    }
    const useCase = new UpdateProjectUseCase(
      new DbProjectCommandRepository(),
      new DbProjectUserDirectory(),
    )
    const result = await useCase.execute({
      project: currentProject,
      scope: access.scope,
      body,
    })
    if (result.isLeft()) return jsonError(result.value.message, result.value.status)

    return NextResponse.json(result.value, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[PATCH /api/projects/[id]]', error)
    return jsonError('Não foi possível salvar as alterações do projeto. Tente novamente.', 500)
  }
}
