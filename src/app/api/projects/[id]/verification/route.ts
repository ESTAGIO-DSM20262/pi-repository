import { NextResponse } from 'next/server'
import { VerifyProjectUseCase } from '@/application/projects/verify-project-use-case'
import { DbProjectRepository } from '@/infrastructure/projects/db-project-repository'
import { DbProjectVerificationRepository } from '@/infrastructure/projects/db-project-verification-repository'
import { resolveProjectViewer } from '@/libs/project-viewer'

interface RouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const viewer = await resolveProjectViewer(request)
    if (!viewer) return jsonError('É necessário entrar no sistema.', 401)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError('Envie os critérios da verificação em formato JSON.', 400)
    }

    const useCase = new VerifyProjectUseCase(
      new DbProjectRepository(),
      new DbProjectVerificationRepository(),
    )
    const result = await useCase.execute({ viewer, projectId: id, body })
    if (result.isLeft()) return jsonError(result.value.message, result.value.status)

    return NextResponse.json(result.value, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[POST /api/projects/[id]/verification]', error)
    return jsonError('Não foi possível registrar a verificação. Tente novamente.', 500)
  }
}
