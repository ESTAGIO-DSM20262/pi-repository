import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import type { AppNotification, NotificationType } from '@/domain/enterprise/entities/notification'

export interface NotificationCreateRecord {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  projectId: string | null
  taskId: string | null
}

export const NOTIFICATION_LIST_LIMIT = 30

export class DbNotificationRepository {
  async createMany(records: NotificationCreateRecord[]): Promise<void> {
    if (records.length === 0) return
    await db.insert(notifications).values(records)
  }

  async listForUser(userId: string, limit = NOTIFICATION_LIST_LIMIT): Promise<AppNotification[]> {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      projectId: row.projectId,
      taskId: row.taskId,
      read: row.readAt !== null,
      createdAt: row.createdAt.toISOString(),
    }))
  }

  async countUnread(userId: string): Promise<number> {
    const [row] = await db
      .select({ total: sql<number>`count(*)`.mapWith(Number) })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    return row?.total ?? 0
  }

  async markRead(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          inArray(notifications.id, ids),
          isNull(notifications.readAt),
        ),
      )
  }

  async markAllRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  }

  async deleteAll(userId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.userId, userId))
  }
}
