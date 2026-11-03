import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { normalizeCourseText, validateCourseInput } from '@/application/courses/course-rules'
import { db } from '@/db'
import { courses, users } from '@/db/schema'
import { listCourses } from '@/infrastructure/courses/course-queries'
import { jsonError, requireAdmin } from '@/libs/admin-api'

const NO_STORE = { 'Cache-Control': 'no-store' }
const MIGRATION_HINT =
  'Não foi possível acessar os cursos. Confirme se a migração 20261102_courses.sql foi aplicada no Neon.'

function isUniqueViolation(error: unknown) {
  const code =
    (error as { cause?: { code?: string }; code?: string })?.cause?.code ??
    (error as { code?: string })?.code
  return code === '23505'
}

export async function GET(request: Request) {
  const access = await requireAdmin(request)
  if (!access.ok) return access.response

  try {
    return NextResponse.json({ courses: await listCourses() }, { headers: NO_STORE })
  } catch (error) {
    console.error('Falha ao listar cursos:', error)
    return jsonError(MIGRATION_HINT, 500)
  }
}

export async function POST(request: Request) {
  const access = await requireAdmin(request)
  if (!access.ok) return access.response

  try {
    const body = (await request.json()) as { name?: unknown; abbreviation?: unknown }
    const validation = validateCourseInput(body, await listCourses())
    if (!validation.ok) return jsonError(validation.error, 400)

    const [created] = await db
      .insert(courses)
      .values({ id: `course-${randomUUID()}`, ...validation.value, active: true })
      .returning()

    return NextResponse.json(
      { course: { ...created, userCount: 0 } },
      { status: 201, headers: NO_STORE },
    )
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError('Já existe um curso com esse nome.', 409)
    console.error('Falha ao cadastrar curso:', error)
    return jsonError('Não foi possível cadastrar o curso.', 500)
  }
}

export async function PATCH(request: Request) {
  const access = await requireAdmin(request)
  if (!access.ok) return access.response

  try {
    const body = (await request.json()) as {
      id?: unknown
      name?: unknown
      abbreviation?: unknown
      active?: unknown
    }
    const id = normalizeCourseText(body.id)
    if (!id) return jsonError('ID do curso não informado.', 400)

    const all = await listCourses()
    const current = all.find((course) => course.id === id)
    if (!current) return jsonError('Curso não encontrado.', 404)

    const nextActive = body.active === undefined ? current.active : body.active
    if (typeof nextActive !== 'boolean') return jsonError('Status inválido.', 400)

    const validation = validateCourseInput(
      {
        name: body.name === undefined ? current.name : body.name,
        abbreviation: body.abbreviation === undefined ? current.abbreviation : body.abbreviation,
      },
      all,
      id,
    )
    if (!validation.ok) return jsonError(validation.error, 400)

    const { name, abbreviation } = validation.value
    const updateCourse = db
      .update(courses)
      .set({ name, abbreviation, active: nextActive, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning()

    // Renomear o curso atualiza os usuários vinculados na mesma transação.
    const [updated] =
      name === current.name
        ? [await updateCourse]
        : await db.batch([
            updateCourse,
            db
              .update(users)
              .set({ course: name, updatedAt: new Date() })
              .where(eq(users.course, current.name)),
          ])

    return NextResponse.json(
      { course: { ...updated[0], userCount: current.userCount } },
      { headers: NO_STORE },
    )
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError('Já existe um curso com esse nome.', 409)
    console.error('Falha ao atualizar curso:', error)
    return jsonError('Não foi possível atualizar o curso.', 500)
  }
}

export async function DELETE(request: Request) {
  const access = await requireAdmin(request)
  if (!access.ok) return access.response

  try {
    const id = normalizeCourseText(new URL(request.url).searchParams.get('id'))
    if (!id) return jsonError('ID do curso não informado.', 400)

    const current = (await listCourses()).find((course) => course.id === id)
    if (!current) return jsonError('Curso não encontrado.', 404)
    if (current.userCount > 0) {
      return jsonError(
        `Este curso tem ${current.userCount} usuário(s) vinculado(s). Desative o curso em vez de excluí-lo.`,
        409,
      )
    }

    await db.delete(courses).where(eq(courses.id, id))
    return NextResponse.json({ ok: true }, { headers: NO_STORE })
  } catch (error) {
    console.error('Falha ao excluir curso:', error)
    return jsonError('Não foi possível excluir o curso.', 500)
  }
}
