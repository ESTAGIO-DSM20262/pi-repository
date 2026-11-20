import { NextResponse } from 'next/server'
import { AssignTaskToProjectsUseCase } from '@/application/projects/assign-task-to-projects-use-case'
import { CompositeProjectRepository } from '@/infrastructure/projects/composite-project-repository'
import { DbProjectTaskRepository } from '@/infrastructure/projects/db-project-task-repository'
import { DbProjectUserDirectory } from '@/infrastructure/projects/db-project-user-directory'
import { auth } from '@/libs/auth'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const sessionUserId = session?.user?.id ? String(session.user.id) : ''
    if (!sessionUserId) return jsonError('É necessário entrar no sistema.', 401)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError('Envie os dados da tarefa em formato JSON.', 400)
    }
    const data = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}

    const useCase = new AssignTaskToProjectsUseCase(
      new CompositeProjectRepository(),
      new DbProjectTaskRepository(),
      new DbProjectUserDirectory(),
    )
    const result = await useCase.execute({ sessionUserId, projectIds: data.projectIds, body })
    if (result.isLeft()) return jsonError(result.value.message, result.value.status)

    const { created, skipped } = result.value
    return NextResponse.json(
      {
        summary: {
          requested: created.length + skipped.length,
          created: created.length,
          skipped: skipped.length,
        },
        created,
        skipped,
      },
      { status: created.length > 0 ? 201 : 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[POST /api/projects/bulk-tasks]', error)
    return jsonError('Não foi possível atribuir a tarefa. Tente novamente.', 500)
  }
}
