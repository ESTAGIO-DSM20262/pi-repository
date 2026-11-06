import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ChooseSemesterAward } from '@/application/projects/choose-semester-award'
import { DbProjectRepository } from '@/infrastructure/projects/db-project-repository'
import { DbSemesterAwardRepository } from '@/infrastructure/projects/db-semester-award-repository'
import { listSemesterAwards } from '@/infrastructure/projects/list-semester-awards'
import { resolveProjectViewer } from '@/libs/project-viewer'

const selectionSchema = z.object({
  projectId: z.string().min(1),
  expectedWinnerId: z.string().min(1).nullable(),
  remove: z.boolean().optional(),
})

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(request: Request) {
  try {
    const viewer = await resolveProjectViewer(request)
    if (!viewer) return json({ error: 'É necessário entrar no sistema.' }, 401)
    if (viewer.role === 'student')
      return json({ error: 'Acesso restrito a professores e administradores.' }, 403)
    const candidates = await listSemesterAwards(viewer)
    const projectId = new URL(request.url).searchParams.get('projectId')
    return json({
      candidates: projectId
        ? candidates.filter((item) => item.project.id === projectId)
        : candidates,
    })
  } catch (error) {
    console.error('[GET /api/semester-awards]', error)
    return json({ error: 'Não foi possível carregar os melhores PIs. Tente novamente.' }, 500)
  }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin')
    if (origin && origin !== new URL(request.url).origin)
      return json({ error: 'Origem não permitida.' }, 403)
    const viewer = await resolveProjectViewer(request)
    if (!viewer) return json({ error: 'É necessário entrar no sistema.' }, 401)
    const parsed = selectionSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success)
      return json({ error: 'Informe o projeto e a escolha atual corretamente.' }, 400)
    const result = await new ChooseSemesterAward(
      new DbProjectRepository(),
      new DbSemesterAwardRepository(),
    ).execute({ viewer, ...parsed.data })
    if (result.isLeft()) return json({ error: result.value.message }, result.value.status)
    return json(result.value)
  } catch (error) {
    console.error('[POST /api/semester-awards]', error)
    return json(
      { error: 'Não foi possível salvar a escolha. Atualize a lista e tente novamente.' },
      500,
    )
  }
}
