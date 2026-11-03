import { NextResponse } from 'next/server'
import { DeleteProjectUseCase } from '@/application/projects/delete-project-use-case'
import { UpdateProjectUseCase } from '@/application/projects/update-project-use-case'
import { DbProjectCommandRepository } from '@/infrastructure/projects/db-project-command-repository'
import { DbProjectRepository } from '@/infrastructure/projects/db-project-repository'
import { DbProjectUserDirectory } from '@/infrastructure/projects/db-project-user-directory'
import { DbProjectVerificationRepository } from '@/infrastructure/projects/db-project-verification-repository'
import { auth } from '@/libs/auth'
import { resolveProjectEditAccess } from '@/libs/project-edit-access'
import { resolveProjectViewer } from '@/libs/project-viewer'

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

    const useCase = new UpdateProjectUseCase(
      new DbProjectCommandRepository(),
      new DbProjectUserDirectory(),
      new DbProjectVerificationRepository(),
    )
    const result = await useCase.execute({
      project: access.project,
      viewer: access.user,
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

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const viewer = await resolveProjectViewer(request)
    if (!viewer) return jsonError('É necessário entrar no sistema.', 401)

    const useCase = new DeleteProjectUseCase(
      new DbProjectRepository(),
      new DbProjectCommandRepository(),
    )
    const result = await useCase.execute({ viewer, projectId: id })
    if (result.isLeft()) return jsonError(result.value.message, result.value.status)

    return NextResponse.json(result.value, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[DELETE /api/projects/[id]]', error)
    return jsonError('Não foi possível excluir o projeto. Tente novamente.', 500)
  }
}
