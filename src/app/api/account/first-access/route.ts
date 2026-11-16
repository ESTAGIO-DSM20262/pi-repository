import { and, eq, ne } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { accounts, sessions, users } from '@/db/schema'
import { auth } from '@/libs/auth'
import { newPasswordSchema } from '@/presentation/auth/validation'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return jsonError('É necessário entrar no sistema.', 401)

  try {
    const body = (await request.json().catch(() => null)) as { newPassword?: unknown } | null
    const parsed = newPasswordSchema.safeParse(body?.newPassword)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Senha inválida.', 400)
    }
    const newPassword = parsed.data
    const userId = session.user.id

    const [user] = await db
      .select({ mustChangePassword: users.mustChangePassword, active: users.active })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!user || user.active === false) return jsonError('Esta conta não está disponível.', 403)
    if (!user.mustChangePassword) return jsonError('Sua senha pessoal já foi definida.', 409)

    const [account] = await db
      .select({ id: accounts.id, password: accounts.password })
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'credential')))
      .limit(1)
    if (!account?.password) {
      return jsonError('Não foi possível localizar a senha inicial desta conta.', 400)
    }

    const context = await auth.$context
    const sameAsInitial = await context.password.verify({
      hash: account.password,
      password: newPassword,
    })
    if (sameAsInitial) {
      return jsonError('Escolha uma senha diferente da senha inicial enviada por e-mail.', 400)
    }

    const now = new Date()
    await db
      .update(accounts)
      .set({ password: await context.password.hash(newPassword), updatedAt: now })
      .where(eq(accounts.id, account.id))
    await db
      .update(users)
      .set({ mustChangePassword: false, updatedAt: now })
      .where(eq(users.id, userId))
    await db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), ne(sessions.id, session.session.id)))

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Falha ao definir a senha do primeiro acesso:', error)
    return jsonError('Não foi possível salvar a nova senha. Tente novamente.', 500)
  }
}
