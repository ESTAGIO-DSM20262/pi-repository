import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { isRole } from '@/domain/enterprise/entities/role'
import { auth } from '@/libs/auth'
import {
  getSafeSocialProfileUrl,
  validateSocialProfileUrl,
} from '@/presentation/profile/social-profile-url'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

async function getActiveUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.id)
    return { error: jsonError('Entre na sua conta para acessar o perfil.', 401) }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      registrationNumber: users.registrationNumber,
      course: users.course,
      githubUrl: users.githubUrl,
      linkedinUrl: users.linkedinUrl,
      active: users.active,
    })
    .from(users)
    .where(eq(users.id, String(session.user.id)))
    .limit(1)

  if (!user?.active) return { error: jsonError('Sua conta não está ativa.', 403) }
  if (!isRole(user.role)) return { error: jsonError('O perfil da conta é inválido.', 403) }

  // Não retorna URLs legadas inválidas à interface, mesmo que tenham sido
  // gravadas antes da validação ou editadas diretamente no banco.
  return {
    user: {
      ...user,
      githubUrl: getSafeSocialProfileUrl(user.githubUrl, 'github'),
      linkedinUrl: getSafeSocialProfileUrl(user.linkedinUrl, 'linkedin'),
    },
  }
}

export async function GET(request: Request) {
  try {
    const result = await getActiveUser(request)
    if ('error' in result) return result.error
    return NextResponse.json({ profile: result.user }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Falha ao carregar perfil:', error)
    return jsonError('Não foi possível carregar seu perfil.', 500)
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await getActiveUser(request)
    if ('error' in result) return result.error

    const body = (await request.json().catch(() => null)) as {
      name?: unknown
      email?: unknown
      githubUrl?: unknown
      linkedinUrl?: unknown
    } | null
    if (!body) return jsonError('Os dados enviados são inválidos.', 400)

    const github =
      body.githubUrl === undefined
        ? { valid: true as const, value: result.user.githubUrl }
        : validateSocialProfileUrl(body.githubUrl, 'github')
    if (!github.valid) {
      return jsonError(github.error, 400)
    }
    const linkedin =
      body.linkedinUrl === undefined
        ? { valid: true as const, value: result.user.linkedinUrl }
        : validateSocialProfileUrl(body.linkedinUrl, 'linkedin')
    if (!linkedin.valid) {
      return jsonError(linkedin.error, 400)
    }

    const values: {
      updatedAt: Date
      githubUrl: string | null
      linkedinUrl: string | null
      name?: string
      email?: string
    } = {
      updatedAt: new Date(),
      githubUrl: github.value,
      linkedinUrl: linkedin.value,
    }

    // Alunos e professores podem atualizar apenas seus links sociais.
    // O administrador também pode atualizar o próprio nome e e-mail.
    if (result.user.role === 'admin') {
      const name = body.name === undefined ? result.user.name : body.name
      const email =
        body.email === undefined
          ? result.user.email
          : typeof body.email === 'string'
            ? body.email.trim().toLowerCase()
            : ''

      if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 160) {
        return jsonError('O nome deve ter entre 3 e 160 caracteres.', 400)
      }
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonError('Informe um endereço de e-mail válido.', 400)
      }

      const [emailOwner] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
      if (emailOwner && emailOwner.id !== result.user.id) {
        return jsonError('Já existe uma conta com esse e-mail.', 409)
      }

      values.name = name.trim()
      values.email = email
    }

    const [updated] = await db
      .update(users)
      .set(values)
      .where(eq(users.id, result.user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        registrationNumber: users.registrationNumber,
        course: users.course,
        githubUrl: users.githubUrl,
        linkedinUrl: users.linkedinUrl,
        active: users.active,
      })

    return NextResponse.json({ profile: updated }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const errorCode =
      (error as { cause?: { code?: string }; code?: string })?.cause?.code ??
      (error as { code?: string })?.code
    if (errorCode === '23505') return jsonError('Já existe uma conta com esse e-mail.', 409)
    console.error('Falha ao salvar perfil:', error)
    return jsonError('Não foi possível salvar seu perfil. Tente novamente.', 500)
  }
}
