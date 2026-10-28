import type { ProjectVerificationRecord } from '@/domain/enterprise/entities/project-verification'

export interface ProjectVerificationRepository {
  findByProject(projectId: string): Promise<ProjectVerificationRecord[]>
  save(projectId: string, record: ProjectVerificationRecord, verified: boolean): Promise<void>
  removeByEmails(projectId: string, emails: string[]): Promise<void>
  clear(projectId: string): Promise<void>
}
