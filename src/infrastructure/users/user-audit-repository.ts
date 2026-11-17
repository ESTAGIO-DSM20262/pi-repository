import { randomUUID } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { userAuditEvents } from '@/db/schema'
import type {
  UserAuditAction,
  UserAuditDetails,
  UserAuditEvent,
} from '@/domain/enterprise/entities/user-audit'

export interface RecordUserAuditInput {
  userId: string
  actor: { id: string; name: string }
  action: UserAuditAction
  summary: string
  details: UserAuditDetails
}

export async function recordUserAuditEvent(input: RecordUserAuditInput): Promise<void> {
  await db.insert(userAuditEvents).values({
    id: randomUUID(),
    userId: input.userId,
    actorId: input.actor.id,
    actorName: input.actor.name,
    action: input.action,
    summary: input.summary,
    details: input.details,
  })
}

export async function listUserAuditEvents(userId: string, limit = 100): Promise<UserAuditEvent[]> {
  const rows = await db
    .select()
    .from(userAuditEvents)
    .where(eq(userAuditEvents.userId, userId))
    .orderBy(desc(userAuditEvents.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    actorId: row.actorId,
    actorName: row.actorName,
    action: row.action,
    summary: row.summary,
    details: row.details,
    createdAt: row.createdAt.toISOString(),
  }))
}
