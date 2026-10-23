import { and, asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { projectFavorites } from '@/db/schema'
import { CompositeProjectRepository } from '@/infrastructure/projects/composite-project-repository'
import { auth } from '@/libs/auth'

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}

async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user?.id ? String(session.user.id) : null
}

async function isFavoriteableProject(projectId: string): Promise<boolean> {
  const project = await new CompositeProjectRepository().findById(projectId)
  return project?.status === 'publicado'
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return jsonError('Entre no sistema para consultar seus favoritos.', 401)

  try {
    const rows = await db
      .select({ projectId: projectFavorites.projectId })
      .from(projectFavorites)
      .where(eq(projectFavorites.userId, userId))
      .orderBy(asc(projectFavorites.createdAt))

    return NextResponse.json(
      { favoriteIds: rows.map((row) => row.projectId) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[GET /api/favorites]', error)
    return jsonError('Não foi possível carregar seus favoritos.', 500)
  }
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return jsonError('Entre no sistema para favoritar projetos.', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('Envie um corpo JSON válido.', 400)
  }

  const projectId =
    body && typeof body === 'object' && 'projectId' in body && typeof body.projectId === 'string'
      ? body.projectId.trim()
      : ''

  if (!projectId || !(await isFavoriteableProject(projectId))) {
    return jsonError('O projeto selecionado não existe ou não está publicado.', 400)
  }

  try {
    await db.insert(projectFavorites).values({ userId, projectId }).onConflictDoNothing()

    return NextResponse.json(
      { favoriteId: projectId, isFavorite: true },
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch (error) {
    console.error('[POST /api/favorites]', error)
    return jsonError('Não foi possível adicionar o projeto aos favoritos.', 500)
  }
}

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return jsonError('Entre no sistema para remover favoritos.', 401)

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')?.trim() ?? ''
  if (!projectId) return jsonError('Informe o projeto que deseja remover.', 400)

  try {
    await db
      .delete(projectFavorites)
      .where(and(eq(projectFavorites.userId, userId), eq(projectFavorites.projectId, projectId)))

    return NextResponse.json(
      { favoriteId: projectId, isFavorite: false },
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  } catch (error) {
    console.error('[DELETE /api/favorites]', error)
    return jsonError('Não foi possível remover o projeto dos favoritos.', 500)
  }
}
