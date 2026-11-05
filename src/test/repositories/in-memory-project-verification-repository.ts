import type { ProjectAdvisor } from '@/domain/enterprise/entities/project'
import {
  buildVerificationSummary,
  type ProjectVerificationRecord,
} from '@/domain/enterprise/entities/project-verification'
import type { ProjectVerificationRepository } from '@/domain/enterprise/repositories/project-verification-repository'

export class InMemoryProjectVerificationRepository implements ProjectVerificationRepository {
  readonly records = new Map<string, ProjectVerificationRecord[]>()
  readonly verifiedFlags = new Map<string, boolean>()
  readonly refreshedProjectIds: string[] = []

  constructor(private readonly advisorsByProject: Record<string, ProjectAdvisor[]> = {}) {}

  async findByProject(projectId: string) {
    return [...(this.records.get(projectId) ?? [])]
  }

  async save(projectId: string, record: ProjectVerificationRecord) {
    const others = (this.records.get(projectId) ?? []).filter(
      (item) => item.verifierUserId !== record.verifierUserId,
    )
    const records = [...others, record]
    this.records.set(projectId, records)
    const advisors = this.advisorsByProject[projectId] ?? []
    this.verifiedFlags.set(projectId, buildVerificationSummary(advisors, records).complete)
  }

  async removeByUser(projectId: string, verifierUserId: string) {
    const records = (this.records.get(projectId) ?? []).filter(
      (item) => item.verifierUserId !== verifierUserId,
    )
    this.records.set(projectId, records)
    const advisors = this.advisorsByProject[projectId] ?? []
    this.verifiedFlags.set(projectId, buildVerificationSummary(advisors, records).complete)
  }

  async removeByEmails(projectId: string, emails: string[]) {
    const removed = new Set(emails.map((email) => email.toLowerCase()))
    this.records.set(
      projectId,
      (this.records.get(projectId) ?? []).filter(
        (item) => !removed.has(item.verifierEmail.toLowerCase()),
      ),
    )
  }

  async clear(projectId: string) {
    this.records.delete(projectId)
  }

  async refreshVerified(projectId: string) {
    this.refreshedProjectIds.push(projectId)
  }
}
