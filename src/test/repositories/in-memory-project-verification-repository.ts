import type { ProjectVerificationRecord } from '@/domain/enterprise/entities/project-verification'
import type { ProjectVerificationRepository } from '@/domain/enterprise/repositories/project-verification-repository'

export class InMemoryProjectVerificationRepository implements ProjectVerificationRepository {
  readonly records = new Map<string, ProjectVerificationRecord[]>()
  readonly verifiedFlags = new Map<string, boolean>()

  async findByProject(projectId: string) {
    return [...(this.records.get(projectId) ?? [])]
  }

  async save(projectId: string, record: ProjectVerificationRecord, verified: boolean) {
    const others = (this.records.get(projectId) ?? []).filter(
      (item) => item.verifierUserId !== record.verifierUserId,
    )
    this.records.set(projectId, [...others, record])
    this.verifiedFlags.set(projectId, verified)
  }

  async removeByUser(projectId: string, verifierUserId: string, verified: boolean) {
    this.records.set(
      projectId,
      (this.records.get(projectId) ?? []).filter((item) => item.verifierUserId !== verifierUserId),
    )
    this.verifiedFlags.set(projectId, verified)
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
}
