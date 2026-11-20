import { randomUUID } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { canChangeTaskStatus, statusChangeNote } from '@/application/projects/task-status'
import { db } from '@/db'
import { projectProgressRevisions, projectProgressTasks } from '@/db/schema'
import {
  PROJECT_PROGRESS_STATUSES,
  type ProjectProgressTaskStatus,
} from '@/domain/enterprise/entities/project-progress'
import { resolveProjectProgressAccess } from '@/libs/project-progress-access'

interface RouteContext {
  params: Promise<{ id: string; taskId: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id, taskId } = await context.params
  try {
    const access = await resolveProjectProgressAccess(request, id)
    if (!access.ok) return jsonError(access.message, access.status)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError('Envie os dados em formato JSON.', 400)
    }
    if (!body || typeof body !== 'object') return jsonError('Informe o novo status da tarefa.', 400)
    const data = body as Record<string, unknown>
    const nextStatus = data.status as ProjectProgressTaskStatus
    const userNote = typeof data.changeNote === 'string' ? data.changeNote.trim() : ''
    if (!PROJECT_PROGRESS_STATUSES.includes(nextStatus)) {
      return jsonError('O status selecionado não é válido.', 400)
    }
    if (userNote.length > 500) {
      return jsonError('A observação deve ter no máximo 500 caracteres.', 400)
    }

    const [existing] = await db
      .select()
      .from(projectProgressTasks)
      .where(and(eq(projectProgressTasks.id, taskId), eq(projectProgressTasks.projectId, id)))
      .limit(1)
    if (!existing) return jsonError('A tarefa não foi encontrada.', 404)

    if (!canChangeTaskStatus(access.project, access.user, existing)) {
      if (access.project.status !== 'em_andamento' && access.user.role !== 'admin') {
        return jsonError('Projetos concluídos são somente para consulta.', 409)
      }
      return jsonError(
        access.user.role === 'student'
          ? 'Você só pode atualizar as tarefas do seu grupo ou as atribuídas a você.'
          : 'Somente o orientador principal ou o administrador pode alterar o status.',
        403,
      )
    }

    if (existing.status === nextStatus) {
      return NextResponse.json({ task: existing }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const now = new Date()
    const [updated] = await db
      .update(projectProgressTasks)
      .set({
        status: nextStatus,
        versionMinor: sql`${projectProgressTasks.versionMinor} + 1`,
        updatedAt: now,
      })
      .where(and(eq(projectProgressTasks.id, taskId), eq(projectProgressTasks.projectId, id)))
      .returning()

    const autoNote = statusChangeNote(existing.status, nextStatus)
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
      changeNote: userNote ? `${autoNote} ${userNote}` : autoNote,
      changedByUserId: access.user.id,
      changedAt: now,
    })

    return NextResponse.json({ task: updated }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[PATCH /api/projects/[id]/progress/[taskId]/status]', error)
    return jsonError('Não foi possível atualizar o status da tarefa. Tente novamente.', 500)
  }
}
