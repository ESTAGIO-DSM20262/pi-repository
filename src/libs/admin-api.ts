import { NextResponse } from 'next/server'
import { auth } from '@/libs/auth'

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function requireAdmin(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session)
    return { ok: false as const, response: jsonError('É necessário entrar no sistema.', 401) }
  const role = (session.user as { role?: unknown }).role
  if (role !== 'admin')
    return {
      ok: false as const,
      response: jsonError('Somente administradores podem gerenciar cursos.', 403),
    }
  return { ok: true as const, session }
}
