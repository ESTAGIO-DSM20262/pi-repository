import { randomUUID } from 'node:crypto'
import { inArray, sql } from 'drizzle-orm'
import type {
  TaskEventNotification,
  TaskEventNotifier,
} from '@/application/notifications/task-event-notifier'
import {
  buildTaskNotificationContent,
  resolveTaskNotificationRecipients,
} from '@/application/notifications/task-notifications'
import { db } from '@/db'
import { users } from '@/db/schema'
import { DbNotificationRepository } from './db-notification-repository'

export async function notifyTaskEvent(input: TaskEventNotification): Promise<void> {
  try {
    const emails = resolveTaskNotificationRecipients(input)
    if (emails.length === 0) return

    const recipients = await db
      .select({ id: users.id, role: users.role, active: users.active })
      .from(users)
      .where(inArray(sql`lower(${users.email})`, emails))

    const eligible = recipients.filter((user) => user.active && user.role !== 'admin')
    if (eligible.length === 0) return

    const content = buildTaskNotificationContent(input)
    await new DbNotificationRepository().createMany(
      eligible.map((user) => ({
        id: randomUUID(),
        userId: user.id,
        type: content.type,
        title: content.title,
        message: content.message,
        projectId: input.projectId,
        taskId: input.taskId,
      })),
    )
  } catch (error) {
    console.error('[notificações] Não foi possível registrar a notificação da tarefa.', error)
  }
}

export class DbTaskEventNotifier implements TaskEventNotifier {
  notify(event: TaskEventNotification): Promise<void> {
    return notifyTaskEvent(event)
  }
}
