import type { Role } from '@/domain/enterprise/entities/role'

export interface ProjectDirectoryAccount {
  id: string
  email: string
  name: string
  role: Role
}

export interface ProjectDirectoryPerson {
  email: string
  name: string
  githubUrl: string | null
  linkedinUrl: string | null
}

export interface ProjectUserDirectory {
  findActiveAccountById(id: string): Promise<ProjectDirectoryAccount | null>
  findActiveAdvisorByEmail(email: string): Promise<ProjectDirectoryPerson | null>
  findActiveStudentsByEmails(emails: string[]): Promise<ProjectDirectoryPerson[]>
}
