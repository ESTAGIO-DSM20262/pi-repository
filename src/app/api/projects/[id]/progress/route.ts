import { randomUUID } from 'node:crypto'
import { desc, eq, inArray } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { canEditProgressTask } from '@/application/projects/project-permissions'
import { db } from '@/db'
import { projectProgressRevisions, projectProgressTasks, users } from '@/db/schema'
import { resolveProjectProgressAccess } from '@/libs/project-progress-access'

interface RouteContext {
  params: Promise<{ id: string }>
}

type TaskStatus = 'pending' | 'in_progress' | 'completed'

function progressDatabaseErrorMessage(error: unknown, fallback: string) {
  const detail = error instanceof Error ? error.message : String(error)
  if (/42P01|relation ["']?project_progress_(tasks|revisions)["']? does not exist/i.test(detail)) {
    return 'As tabelas do progresso ainda não existem no banco. Execute src/db/migrations/20261014_project_progress.sql no SQL Editor do Neon e tente novamente.'
  }
  return fallback
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}

interface ParsedTaskInput {
  title: string
  description: string
  targetStudentEmail: string | null
  dueDate: string | null
  status: TaskStatus | undefined
  changeNote: string | null
}

type ParseTaskResult = { ok: true; value: ParsedTaskInput } | { ok: false; error: string }

function parseError(error: string): ParseTaskResult {
  return { ok: false, error }
}

function parseTaskInput(body: unknown, memberEmails: string[]): ParseTaskResult {
  if (!body || typeof body !== 'object') return parseError('Informe os dados da tarefa.')
  const data = body as Record<string, unknown>
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const description = typeof data.description === 'string' ? data.description.trim() : ''
  const targetValue =
    typeof data.targetStudentEmail === 'string' ? data.targetStudentEmail.trim().toLowerCase() : ''
  const dueDateValue = typeof data.dueDate === 'string' ? data.dueDate.trim() : ''
  const changeNote = typeof data.changeNote === 'string' ? data.changeNote.trim() : ''
  const statusValue = data.status
  const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed']

  if (title.length < 3 || title.length > 160) {
    return parseError('O título deve ter entre 3 e 160 caracteres.')
  }
  if (description.length < 5 || description.length > 5000) {
    return parseError('A descrição deve ter entre 5 e 5.000 caracteres.')
  }
  if (targetValue && !memberEmails.some((email) => email.trim().toLowerCase() === targetValue)) {
    return parseError('Selecione um integrante válido deste projeto.')
  }
  if (
    dueDateValue &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateValue) ||
      Number.isNaN(Date.parse(`${dueDateValue}T00:00:00Z`)))
  ) {
    return parseError('Informe uma data de entrega válida.')
  }
  if (statusValue !== undefined && !statuses.includes(statusValue as TaskStatus)) {
    return parseError('O status selecionado não é válido.')
  }
  if (changeNote.length > 500) return parseError('A observação deve ter no máximo 500 caracteres.')

  return {
    ok: true,
    value: {
      title,
      description,
      targetStudentEmail: targetValue || null,
      dueDate: dueDateValue || null,
      status: statusValue as TaskStatus | undefined,
      changeNote: changeNote || null,
    },
  }
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  try {
    const access = await resolveProjectProgressAccess(request, id)
    if (!access.ok) return jsonError(access.message, access.status)

    const allTasks = await db
      .select()
      .from(projectProgressTasks)
      .where(eq(projectProgressTasks.projectId, id))
      .orderBy(desc(projectProgressTasks.versionMajor), desc(projectProgressTasks.createdAt))

    const visibleTasks = access.canViewAllTasks
      ? allTasks
      : allTasks.filter(
          (task) =>
            !task.targetStudentEmail || task.targetStudentEmail.toLowerCase() === access.user.email,
        )
    const visibleIds = visibleTasks.map((task) => task.id)
    const allRevisions =
      visibleIds.length > 0
        ? await db
            .select()
            .from(projectProgressRevisions)
            .where(inArray(projectProgressRevisions.taskId, visibleIds))
            .orderBy(desc(projectProgressRevisions.changedAt))
        : []
    const revisions = access.canViewAllTasks
      ? allRevisions
      : allRevisions.filter(
          (revision) =>
            !revision.targetStudentEmail ||
            revision.targetStudentEmail.toLowerCase() === access.user.email,
        )

    const personIds = [
      ...new Set([
        ...visibleTasks.map((task) => task.createdByUserId),
        ...revisions.map((revision) => revision.changedByUserId),
      ]),
    ]
    const people =
      personIds.length > 0
        ? await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(inArray(users.id, personIds))
        : []
    const nameById = new Map(people.map((person) => [person.id, person.name]))
    const viewer = { id: access.user.id, email: access.user.email, role: access.user.role }

    const tasks = visibleTasks.map((task) => {
      const lastEdit = revisions.find(
        (revision) => revision.taskId === task.id && revision.action === 'updated',
      )
      return {
        ...task,
        createdByName: nameById.get(task.createdByUserId) ?? 'Usuário removido',
        lastEditedByName: lastEdit
          ? (nameById.get(lastEdit.changedByUserId) ?? 'Usuário removido')
          : null,
        lastEditedAt: lastEdit?.changedAt ?? null,
        canEdit: canEditProgressTask(access.project, viewer, task),
      }
    })

    return NextResponse.json(
      {
        tasks,
        revisions: revisions.map((revision) => ({
          ...revision,
          changedByName: nameById.get(revision.changedByUserId) ?? 'Usuário removido',
        })),
        canManage: access.canManage,
        projectStatus: access.project.status,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[GET /api/projects/[id]/progress]', error)
    return jsonError(
      progressDatabaseErrorMessage(error, 'Não foi possível carregar o progresso do projeto.'),
      500,
    )
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  try {
    const access = await resolveProjectProgressAccess(request, id)
    if (!access.ok) return jsonError(access.message, access.status)
    if (
      access.user.role === 'student' ||
      (access.user.role === 'professor' &&
        !access.canManage &&
        access.project.status === 'em_andamento')
    ) {
      return jsonError(
        'Somente o professor responsável ou o administrador pode criar tarefas.',
        403,
      )
    }
    if (access.project.status !== 'em_andamento') {
      return jsonError(
        'Projetos concluídos são somente para consulta. Não é possível adicionar tarefas.',
        409,
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError('Envie os dados da tarefa em formato JSON.', 400)
    }

    const parsed = parseTaskInput(body, access.project.memberEmails)
    if (!parsed.ok) return jsonError(parsed.error, 400)

    const [latestTask] = await db
      .select({ versionMajor: projectProgressTasks.versionMajor })
      .from(projectProgressTasks)
      .where(eq(projectProgressTasks.projectId, id))
      .orderBy(desc(projectProgressTasks.versionMajor))
      .limit(1)

    const now = new Date()
    const taskValues = {
      id: randomUUID(),
      projectId: id,
      title: parsed.value.title,
      description: parsed.value.description,
      versionMajor: (latestTask?.versionMajor ?? 0) + 1,
      versionMinor: 0,
      status: 'pending' as const,
      targetStudentEmail: parsed.value.targetStudentEmail,
      dueDate: parsed.value.dueDate,
      createdByUserId: access.user.id,
      createdAt: now,
      updatedAt: now,
    }

    const [task] = await db.insert(projectProgressTasks).values(taskValues).returning()
    await db.insert(projectProgressRevisions).values({
      id: randomUUID(),
      taskId: task.id,
      projectId: id,
      title: task.title,
      description: task.description,
      versionMajor: task.versionMajor,
      versionMinor: task.versionMinor,
      status: task.status,
      targetStudentEmail: task.targetStudentEmail,
      dueDate: task.dueDate,
      action: 'created',
      changeNote: parsed.value.changeNote ?? 'Tarefa criada',
      changedByUserId: access.user.id,
      changedAt: now,
    })

    return NextResponse.json({ task }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[POST /api/projects/[id]/progress]', error)
    return jsonError(
      progressDatabaseErrorMessage(error, 'Não foi possível criar a tarefa. Tente novamente.'),
      500,
    )
  }
}
