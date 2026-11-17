import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { listUserAuditEvents } from '@/infrastructure/users/user-audit-repository'
import { jsonError, requireAdmin } from '@/libs/admin-api'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const access = await requireAdmin(request, 'Somente administradores podem ver o histórico.')
  if (!access.ok) return access.response

  const { id } = await context.params

  try {
    const [user] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    if (!user) return jsonError('Usuário não encontrado.', 404)

    const events = await listUserAuditEvents(user.id)
    return NextResponse.json({ user, events }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Falha ao carregar o histórico do usuário:', error)
    return jsonError(
      'Não foi possível carregar o histórico. Confirme se a migração SQL de auditoria foi aplicada.',
      500,
    )
  }
}
