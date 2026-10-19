import { randomBytes, randomUUID } from 'node:crypto'
import { asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { type ImportedUserRow, parseUserWorkbook } from '@/application/users/user-import'
import { db } from '@/db'
import { accounts, sessions, users } from '@/db/schema'
import { isRole, type Role } from '@/domain/enterprise/entities/role'
import { auth } from '@/libs/auth'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_IMPORT_ROWS = 500

type UserInput = {
  name?: unknown
  email?: unknown
  role?: unknown
  registrationNumber?: unknown
  course?: unknown
}

type CredentialResult = {
  name: string
  email: string
  role: Role
  password: string
  registrationNumber: string
  course: string
}

class UserInputError extends Error {}
class DuplicateUserError extends Error {}

function normalizedString(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
        .replace(/\u00a0/g, ' ')
        .trim()
    : ''
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

async function requireAdmin(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session)
    return { ok: false as const, response: jsonError('É necessário entrar no sistema.', 401) }
  const role = (session.user as { role?: unknown }).role
  if (role !== 'admin')
    return {
      ok: false as const,
      response: jsonError('Somente administradores podem gerenciar usuários.', 403),
    }
  return { ok: true as const, session }
}

function normalizeAndValidate(input: UserInput): Omit<ImportedUserRow, 'sheet' | 'rowNumber'> {
  const name = normalizedString(input.name)
  const email = normalizedString(input.email).toLowerCase()
  const role = input.role
  const registrationNumber = normalizedString(input.registrationNumber)
  const course = normalizedString(input.course)

  if (name.length < 3) throw new UserInputError('Informe o nome completo do usuário.')
  if (name.length > 160) throw new UserInputError('O nome deve ter no máximo 160 caracteres.')
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new UserInputError('Informe um endereço de e-mail válido.')
  }
  if (!isRole(role))
    throw new UserInputError('Selecione um perfil válido: aluno, professor ou administrador.')
  if (registrationNumber.length > 80)
    throw new UserInputError('RA/matrícula deve ter no máximo 80 caracteres.')
  if (course.length > 160) throw new UserInputError('O curso deve ter no máximo 160 caracteres.')

  if (role !== 'admin' && !registrationNumber) {
    throw new UserInputError(
      role === 'student' ? 'Informe o RA do aluno.' : 'Informe a matrícula funcional do professor.',
    )
  }
  if (role === 'student' && !course) throw new UserInputError('Informe o curso do aluno.')

  return { name, email, role, registrationNumber, course }
}

function createTemporaryPassword() {
  return randomBytes(18).toString('base64url')
}

async function createUserAccount(
  input: UserInput,
  passwordContext: { hash: (password: string) => Promise<string> },
) {
  const user = normalizeAndValidate(input)
  const alreadyExists = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, user.email))
    .limit(1)
  if (alreadyExists.length > 0) throw new DuplicateUserError('Este e-mail já está cadastrado.')

  const password = createTemporaryPassword()
  const passwordHash = await passwordContext.hash(password)
  const userId = randomUUID()
  const now = new Date()

  const inserted = await db
    .insert(users)
    .values({
      id: userId,
      name: user.name,
      email: user.email,
      emailVerified: true,
      image: null,
      role: user.role,
      registrationNumber: user.registrationNumber || null,
      course: user.course || null,
      active: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id })

  if (inserted.length === 0) throw new DuplicateUserError('Este e-mail já está cadastrado.')

  try {
    await db.insert(accounts).values({
      id: randomUUID(),
      accountId: userId,
      providerId: 'credential',
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    })
  } catch (error) {
    await db
      .delete(users)
      .where(eq(users.id, userId))
      .catch(() => undefined)
    throw error
  }

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    password,
    registrationNumber: user.registrationNumber,
    course: user.course,
  }
}

async function handleSingleCreate(request: Request) {
  const body = (await request.json()) as UserInput
  const context = await auth.$context
  const credential = await createUserAccount(body, context.password)
  return NextResponse.json(
    { credential },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  )
}

async function handleBulkCreate(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return jsonError('Selecione uma planilha para importar.', 400)
  if (file.size === 0) return jsonError('O arquivo selecionado está vazio.', 400)
  if (file.size > MAX_FILE_BYTES) return jsonError('O arquivo ultrapassa o limite de 5 MB.', 413)
  const allowedExtension = /\.(xlsx|xls|csv)$/i.test(file.name)
  if (!allowedExtension) return jsonError('Formato não suportado. Envie .xlsx, .xls ou .csv.', 400)

  let parsed: ReturnType<typeof parseUserWorkbook>
  try {
    parsed = parseUserWorkbook(new Uint8Array(await file.arrayBuffer()))
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Não foi possível ler a planilha.',
      400,
    )
  }

  if (parsed.rows.length > MAX_IMPORT_ROWS)
    return jsonError(`O limite é de ${MAX_IMPORT_ROWS} registros por lote.`, 400)

  const context = await auth.$context
  const credentials: CredentialResult[] = []
  const skipped: Array<{ sheet: string; rowNumber: number; email: string; reason: string }> = []
  const errors: Array<{ sheet: string; rowNumber: number; email: string; reason: string }> = []
  const seenEmails = new Set<string>()

  for (const row of parsed.rows) {
    if (row.role === 'admin') {
      errors.push({
        sheet: row.sheet,
        rowNumber: row.rowNumber,
        email: row.email,
        reason: 'Administradores devem ser cadastrados individualmente no painel.',
      })
      continue
    }
    const email = row.email.trim().toLowerCase()
    if (email && seenEmails.has(email)) {
      skipped.push({
        sheet: row.sheet,
        rowNumber: row.rowNumber,
        email,
        reason: 'E-mail repetido na própria planilha.',
      })
      continue
    }
    if (email) seenEmails.add(email)

    try {
      credentials.push(await createUserAccount(row, context.password))
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Falha inesperada ao cadastrar esta linha.'
      const item = { sheet: row.sheet, rowNumber: row.rowNumber, email, reason }
      if (error instanceof DuplicateUserError) {
        skipped.push(item)
      } else {
        errors.push(item)
        if (!(error instanceof UserInputError)) break
      }
    }
  }

  return NextResponse.json(
    {
      summary: {
        sheets: parsed.sheetNames,
        read: parsed.rows.length,
        created: credentials.length,
        skipped: skipped.length,
        invalid: parsed.errors.length + errors.length,
      },
      credentials,
      skipped,
      errors: [...parsed.errors, ...errors],
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function GET(request: Request) {
  const access = await requireAdmin(request)
  if (!access.ok) return access.response

  try {
    const records = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        registrationNumber: users.registrationNumber,
        course: users.course,
        active: users.active,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.name))
      .limit(1000)

    return NextResponse.json({ users: records }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Falha ao listar usuários administrativos:', error)
    return jsonError(
      'Não foi possível listar usuários. Confirme se as migrações SQL de usuários foram aplicadas no Neon.',
      500,
    )
  }
}

export async function POST(request: Request) {
  const access = await requireAdmin(request)
  if (!access.ok) return access.response

  try {
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('multipart/form-data')) return await handleBulkCreate(request)
    return await handleSingleCreate(request)
  } catch (error) {
    if (error instanceof UserInputError) return jsonError(error.message, 400)
    if (error instanceof DuplicateUserError) return jsonError(error.message, 409)
    console.error('Falha ao cadastrar usuário:', error)
    return jsonError(
      'Não foi possível cadastrar o usuário. Confira as tabelas e a migração do banco.',
      500,
    )
  }
}

export async function PATCH(request: Request) {
  const access = await requireAdmin(request)
  if (!access.ok) return access.response

  try {
    const body = (await request.json()) as UserInput & { id?: unknown; active?: unknown }
    const id = normalizedString(body.id)
    if (!id) return jsonError('ID do usuário não informado.', 400)

    const existing = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!existing[0]) return jsonError('Usuário não encontrado.', 404)
    const current = existing[0]

    const nextName = body.name === undefined ? current.name : normalizedString(body.name)
    const nextEmail =
      body.email === undefined ? current.email : normalizedString(body.email).toLowerCase()
    const nextRole = body.role === undefined ? current.role : body.role
    const nextRegistration =
      body.registrationNumber === undefined
        ? current.registrationNumber
        : normalizedString(body.registrationNumber) || null
    const nextCourse =
      body.course === undefined ? current.course : normalizedString(body.course) || null
    const nextActive = body.active === undefined ? current.active : body.active

    const isEditingSelf = id === String(access.session.user.id)
    if (
      isEditingSelf &&
      ((current.active && nextActive === false) ||
        nextRole !== current.role ||
        nextEmail !== current.email)
    ) {
      return jsonError(
        'Por segurança, não é possível desativar a própria conta nem alterar o próprio perfil ou e-mail. Solicite a outro administrador.',
        400,
      )
    }

    if (typeof nextName !== 'string' || nextName.trim().length < 3 || nextName.length > 160)
      return jsonError('Informe um nome válido (3 a 160 caracteres).', 400)
    if (nextEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail))
      return jsonError('Informe um endereço de e-mail válido.', 400)
    if (!isRole(nextRole)) return jsonError('Perfil inválido.', 400)
    if (typeof nextActive !== 'boolean') return jsonError('Status inválido.', 400)

    if (nextRole !== 'admin' && !String(nextRegistration ?? '').trim())
      return jsonError('RA/matrícula é obrigatório para alunos e professores.', 400)
    if (nextRole === 'student' && !String(nextCourse ?? '').trim())
      return jsonError('Curso é obrigatório para alunos.', 400)

    const updated = await db
      .update(users)
      .set({
        name: nextName.trim(),
        email: nextEmail,
        role: nextRole,
        registrationNumber: nextRegistration,
        course: nextCourse,
        active: nextActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        registrationNumber: users.registrationNumber,
        course: users.course,
        active: users.active,
        createdAt: users.createdAt,
      })

    if (!nextActive || nextRole !== current.role || nextEmail !== current.email) {
      await db.delete(sessions).where(eq(sessions.userId, id))
    }

    return NextResponse.json({ user: updated[0] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const errorCode =
      (error as { cause?: { code?: string }; code?: string })?.cause?.code ??
      (error as { code?: string })?.code
    if (errorCode === '23505') return jsonError('Já existe uma conta com esse e-mail.', 409)
    console.error('Falha ao atualizar usuário:', error)
    return jsonError(
      'Não foi possível atualizar o usuário. Confirme se a migração SQL foi aplicada.',
      500,
    )
  }
}
