import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import { projects, projectVerifications } from '@/db/schema'
import type { ProjectVerificationRecord } from '@/domain/enterprise/entities/project-verification'
import type { ProjectVerificationRepository } from '@/domain/enterprise/repositories/project-verification-repository'

function lockProject(projectId: string) {
  return db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .for('update')
}

function recomputeVerified(projectId: string) {
  return db
    .update(projects)
    .set({
      verified: sql`${projects.status} = 'publicado' AND NOT EXISTS (
        SELECT 1
        FROM (
          SELECT lower(${projects.advisorEmail}) AS email
          UNION
          SELECT lower(advisor ->> 'email') FROM jsonb_array_elements(${projects.coAdvisors}) AS advisor
        ) AS project_advisors
        WHERE NOT EXISTS (
          SELECT 1
          FROM ${projectVerifications}
          WHERE ${projectVerifications.projectId} = ${projects.id}
            AND ${projectVerifications.verifierRole} = 'professor'
            AND lower(${projectVerifications.verifierEmail}) = project_advisors.email
        )
      )`,
    })
    .where(eq(projects.id, projectId))
}

export class DbProjectVerificationRepository implements ProjectVerificationRepository {
  async findByProject(projectId: string): Promise<ProjectVerificationRecord[]> {
    const rows = await db
      .select()
      .from(projectVerifications)
      .where(eq(projectVerifications.projectId, projectId))
      .orderBy(projectVerifications.verifiedAt)

    return rows.map((row) => ({
      verifierUserId: row.verifierUserId,
      verifierEmail: row.verifierEmail,
      verifierName: row.verifierName,
      verifierRole: row.verifierRole,
      criteria: row.criteria,
      verifiedAt: row.verifiedAt.toISOString(),
    }))
  }

  async save(projectId: string, record: ProjectVerificationRecord) {
    const values = {
      projectId,
      verifierUserId: record.verifierUserId,
      verifierEmail: record.verifierEmail,
      verifierName: record.verifierName,
      verifierRole: record.verifierRole,
      criteria: record.criteria,
      verifiedAt: new Date(record.verifiedAt),
    }
    await db.batch([
      lockProject(projectId),
      db
        .insert(projectVerifications)
        .values({ id: crypto.randomUUID(), ...values })
        .onConflictDoUpdate({
          target: [projectVerifications.projectId, projectVerifications.verifierUserId],
          set: {
            verifierEmail: values.verifierEmail,
            verifierName: values.verifierName,
            verifierRole: values.verifierRole,
            criteria: values.criteria,
            verifiedAt: values.verifiedAt,
          },
        }),
      recomputeVerified(projectId),
    ])
  }

  async removeByUser(projectId: string, verifierUserId: string) {
    await db.batch([
      lockProject(projectId),
      db
        .delete(projectVerifications)
        .where(
          and(
            eq(projectVerifications.projectId, projectId),
            eq(projectVerifications.verifierUserId, verifierUserId),
          ),
        ),
      recomputeVerified(projectId),
    ])
  }

  async removeByEmails(projectId: string, emails: string[]) {
    if (emails.length === 0) return
    await db.delete(projectVerifications).where(
      and(
        eq(projectVerifications.projectId, projectId),
        inArray(
          sql<string>`lower(${projectVerifications.verifierEmail})`,
          emails.map((email) => email.toLowerCase()),
        ),
      ),
    )
  }

  async clear(projectId: string) {
    await db.delete(projectVerifications).where(eq(projectVerifications.projectId, projectId))
  }

  async refreshVerified(projectId: string) {
    await db.batch([lockProject(projectId), recomputeVerified(projectId)])
  }
}
