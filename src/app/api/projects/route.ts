import { NextResponse } from 'next/server'
import { CreateProjectUseCase } from '@/application/projects/create-project-use-case'
import { DbProjectCommandRepository } from '@/infrastructure/projects/db-project-command-repository'
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
      return jsonError('Envie os dados do projeto em formato JSON.', 400)
    }

    const useCase = new CreateProjectUseCase(
      new DbProjectCommandRepository(),
      new DbProjectUserDirectory(),
    )
    const result = await useCase.execute({ sessionUserId, body })
    if (result.isLeft()) {
      return jsonError(result.value.message, result.value.status)
    }

    return NextResponse.json(result.value, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('[POST /api/projects]', error)
    return jsonError('Não foi possível cadastrar o projeto. Tente novamente.', 500)
  }
}
