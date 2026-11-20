import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { DbNotificationRepository } from '@/infrastructure/notifications/db-notification-repository'
import { auth } from '@/libs/auth'

const NO_STORE = { 'Cache-Control': 'no-store' }

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE })
}

async function resolveRecipient(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  const userId = session?.user?.id ? String(session.user.id) : ''
  if (!userId) return null

  const [user] = await db
    .select({ id: users.id, role: users.role, active: users.active })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return user?.active ? user : null
}

export async function GET(request: Request) {
  try {
    const user = await resolveRecipient(request)
    if (!user) return jsonError('Entre no sistema para ver suas notificações.', 401)
    if (user.role === 'admin') {
      return NextResponse.json({ unreadCount: 0, notifications: [] }, { headers: NO_STORE })
    }

    const url = new URL(request.url)
    const countOnly = url.searchParams.get('resumo') === '1'
    const repository = new DbNotificationRepository()

    if (countOnly) {
      return NextResponse.json(
        { unreadCount: await repository.countUnread(user.id) },
        { headers: NO_STORE },
      )
    }

    const [items, unreadCount] = await Promise.all([
      repository.listForUser(user.id),
      repository.countUnread(user.id),
    ])
    return NextResponse.json({ unreadCount, notifications: items }, { headers: NO_STORE })
  } catch (error) {
    console.error('[GET /api/notifications]', error)
    return jsonError('Não foi possível carregar suas notificações.', 500)
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await resolveRecipient(request)
    if (!user) return jsonError('Entre no sistema para atualizar suas notificações.', 401)
    if (user.role === 'admin') return NextResponse.json({ unreadCount: 0 }, { headers: NO_STORE })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError('Envie um corpo JSON válido.', 400)
    }
    const data = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const repository = new DbNotificationRepository()

    if (data.all === true) {
      await repository.markAllRead(user.id)
    } else if (Array.isArray(data.ids)) {
      const ids = data.ids.filter((id): id is string => typeof id === 'string' && id !== '')
      if (ids.length === 0 || ids.length > 100) {
        return jsonError('Informe de 1 a 100 notificações para marcar como lidas.', 400)
      }
      await repository.markRead(user.id, ids)
    } else {
      return jsonError('Informe quais notificações marcar como lidas.', 400)
    }

    return NextResponse.json(
      { unreadCount: await repository.countUnread(user.id) },
      { headers: NO_STORE },
    )
  } catch (error) {
    console.error('[PATCH /api/notifications]', error)
    return jsonError('Não foi possível atualizar suas notificações.', 500)
  }
}
