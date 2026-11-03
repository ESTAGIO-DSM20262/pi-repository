import { NextResponse } from 'next/server'
import { SetProjectActivationUseCase } from '@/application/projects/set-project-activation-use-case'
import { DbProjectCommandRepository } from '@/infrastructure/projects/db-project-command-repository'
import { DbProjectRepository } from '@/infrastructure/projects/db-project-repository'
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
    const viewer = await resolveProjectViewer(request)
    if (!viewer) return jsonError('É necessário entrar no sistema.', 401)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError('Envie os dados em formato JSON.', 400)
    }
    const active = (body as { active?: unknown } | null)?.active
    if (typeof active !== 'boolean') {
      return jsonError('Informe se o projeto deve ficar ativo ou desativado.', 400)
    }

    const useCase = new SetProjectActivationUseCase(
      new DbProjectRepository(),
      new DbProjectCommandRepository(),
    )
    const result = await useCase.execute({ viewer, projectId: id, active })
    if (result.isLeft()) return jsonError(result.value.message, result.value.status)

    return NextResponse.json(result.value, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[PATCH /api/projects/[id]/activation]', error)
    return jsonError('Não foi possível alterar a situação do projeto. Tente novamente.', 500)
  }
}
