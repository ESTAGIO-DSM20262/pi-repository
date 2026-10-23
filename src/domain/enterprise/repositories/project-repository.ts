import type { ProjectPublicDetails, ProjectStatus, ProjectTeamMember } from '@/domain/enterprise/entities/project'
import type { ProjectProgressRevisionAction, ProjectProgressTaskStatus } from '@/domain/enterprise/entities/project-progress'

export interface ProjectCreateRecord {
  id: string
  title: string
  summary: string
  cycle: string
  semester: number
  advisorEmail: string
  advisorName: string
  memberEmails: string[]
  teamMembers: ProjectTeamMember[]
  languages: string[]
  stack: string[]
  theme: string
  status: ProjectStatus
  verified: boolean
  publicDetails: ProjectPublicDetails
  createdByUserId: string
  createdAt: Date
}

export interface ProjectTaskCreateRecord {
  id: string
  projectId: string
  title: string
  description: string
  versionMajor: number
  versionMinor: number
  status: ProjectProgressTaskStatus
  targetStudentEmail: string | null
  dueDate: string | null
  createdByUserId: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectRevisionCreateRecord {
  id: string
  taskId: string
  projectId: string
  title: string
  description: string
  versionMajor: number
  versionMinor: number
  status: ProjectProgressTaskStatus
  targetStudentEmail: string | null
  dueDate: string | null
  action: ProjectProgressRevisionAction
  changeNote: string
  changedByUserId: string
  changedAt: Date
}

export interface ProjectFullUpdateRecord {
  title: string
  summary: string
  cycle: string
  semester: number
  theme: string
  status: ProjectStatus
  languages: string[]
  stack: string[]
  memberEmails: string[]
  teamMembers: ProjectTeamMember[]
  publicDetails: ProjectPublicDetails
}

export interface ProjectRepository {
  create(
    project: ProjectCreateRecord,
    tasks: ProjectTaskCreateRecord[],
    revisions: ProjectRevisionCreateRecord[],
  ): Promise<void>
  update(id: string, record: ProjectFullUpdateRecord): Promise<void>
  updateArtifacts(id: string, publicDetails: ProjectPublicDetails): Promise<void>
  hasTasksAssignedToMembers(projectId: string, memberEmails: string[]): Promise<boolean>
}
