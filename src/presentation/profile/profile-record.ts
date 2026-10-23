import type { Role } from '@/domain/enterprise/entities/role'

export interface ProfileRecord {
  id: string
  name: string
  email: string
  role: Role
  registrationNumber: string | null
  course: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  active: boolean
}
