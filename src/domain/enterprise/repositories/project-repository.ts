import type {
  ProjectAdvisor,
  ProjectPublicDetails,
  ProjectStatus,
  ProjectTeamMember,
} from '@/domain/enterprise/entities/project'
import type {
  ProjectProgressRevisionAction,
  ProjectProgressTaskStatus,
} from '@/domain/enterprise/entities/project-progress'

export interface ProjectCreateRecord {
  id: string
  title: string
  summary: string
  cycle: string
  semester: number
  advisorEmail: string
  advisorName: string
  coAdvisors: ProjectAdvisor[]
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
  coAdvisors: ProjectAdvisor[]
  memberEmails: string[]
  teamMembers: ProjectTeamMember[]
  publicDetails: ProjectPublicDetails
  verified: boolean
}

export interface ProjectAdministrationUpdateRecord {
  advisorEmail: string
  advisorName: string
  coAdvisors: ProjectAdvisor[]
  publicDetails: ProjectPublicDetails
  verified: boolean
}

export interface ProjectRepository {
  create(
    project: ProjectCreateRecord,
    tasks: ProjectTaskCreateRecord[],
    revisions: ProjectRevisionCreateRecord[],
  ): Promise<void>
  update(id: string, record: ProjectFullUpdateRecord): Promise<void>
  updateAsAdministrator(id: string, record: ProjectAdministrationUpdateRecord): Promise<void>
  setActive(id: string, active: boolean, changedAt: Date): Promise<void>
  delete(id: string): Promise<void>
  hasTasksAssignedToMembers(projectId: string, memberEmails: string[]): Promise<boolean>
}
