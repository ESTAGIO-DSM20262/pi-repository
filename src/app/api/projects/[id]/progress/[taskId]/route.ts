import { randomUUID } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { projectProgressRevisions, projectProgressTasks } from '@/db/schema'
import { resolveProjectProgressAccess } from '@/libs/project-progress-access'

interface RouteContext {
  params: Promise<{ id: string; taskId: string }>
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

export async function PATCH(request: Request, context: RouteContext) {
  const { id, taskId } = await context.params
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
        'Somente o professor responsável ou o administrador pode editar tarefas.',
        403,
      )
    }
    if (access.project.status !== 'em_andamento') {
      return jsonError(
        'Projetos concluídos são somente para consulta. Não é possível editar tarefas.',
        409,
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError('Envie os dados da tarefa em formato JSON.', 400)
    }

    if (!body || typeof body !== 'object') return jsonError('Informe os dados da tarefa.', 400)
    const data = body as Record<string, unknown>
    const title = typeof data.title === 'string' ? data.title.trim() : ''
    const description = typeof data.description === 'string' ? data.description.trim() : ''
    const targetValue =
      typeof data.targetStudentEmail === 'string'
        ? data.targetStudentEmail.trim().toLowerCase()
        : ''
    const dueDateValue = typeof data.dueDate === 'string' ? data.dueDate.trim() : ''
    const changeNote = typeof data.changeNote === 'string' ? data.changeNote.trim() : ''
    const statusValue = data.status as TaskStatus
    const allowedStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed']

    if (title.length < 3 || title.length > 160)
      return jsonError('O título deve ter entre 3 e 160 caracteres.', 400)
    if (description.length < 5 || description.length > 5000)
      return jsonError('A descrição deve ter entre 5 e 5.000 caracteres.', 400)
    if (
      targetValue &&
      !access.project.memberEmails.some((email) => email.trim().toLowerCase() === targetValue)
    ) {
      return jsonError('Selecione um integrante válido deste projeto.', 400)
    }
    if (
      dueDateValue &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateValue) ||
        Number.isNaN(Date.parse(`${dueDateValue}T00:00:00Z`)))
    ) {
      return jsonError('Informe uma data de entrega válida.', 400)
    }
    if (!allowedStatuses.includes(statusValue))
      return jsonError('O status selecionado não é válido.', 400)
    if (changeNote.length > 500)
      return jsonError('A observação deve ter no máximo 500 caracteres.', 400)

    const [existing] = await db
      .select()
      .from(projectProgressTasks)
      .where(and(eq(projectProgressTasks.id, taskId), eq(projectProgressTasks.projectId, id)))
      .limit(1)
    if (!existing) return jsonError('A tarefa não foi encontrada.', 404)

    const now = new Date()
    const [updated] = await db
      .update(projectProgressTasks)
      .set({
        title,
        description,
        targetStudentEmail: targetValue || null,
        dueDate: dueDateValue || null,
        status: statusValue,
        versionMinor: sql`${projectProgressTasks.versionMinor} + 1`,
        updatedAt: now,
      })
      .where(and(eq(projectProgressTasks.id, taskId), eq(projectProgressTasks.projectId, id)))
      .returning()

    await db.insert(projectProgressRevisions).values({
      id: randomUUID(),
      taskId: updated.id,
      projectId: id,
      title: updated.title,
      description: updated.description,
      versionMajor: updated.versionMajor,
      versionMinor: updated.versionMinor,
      status: updated.status,
      targetStudentEmail: updated.targetStudentEmail,
      dueDate: updated.dueDate,
      action: 'updated',
      changeNote: changeNote || 'Tarefa atualizada',
      changedByUserId: access.user.id,
      changedAt: now,
    })

    return NextResponse.json({ task: updated }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[PATCH /api/projects/[id]/progress/[taskId]]', error)
    return jsonError(
      progressDatabaseErrorMessage(error, 'Não foi possível salvar as alterações da tarefa.'),
      500,
    )
  }
}
