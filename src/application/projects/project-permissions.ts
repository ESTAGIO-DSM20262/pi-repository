import type { Project } from '@/domain/enterprise/entities/project'
import { isProjectActive, isProjectAdvisor } from '@/domain/enterprise/entities/project-advisors'
import type { Role } from '@/domain/enterprise/entities/role'
import type { ProjectEditScope } from './update-project'

export interface ProjectViewer {
  id: string
  email: string
  name: string
  role: Role
}

type ProjectSubject = Pick<Project, 'advisor' | 'coAdvisors' | 'status' | 'active' | 'memberEmails'>

function normalize(email: string) {
  return email.trim().toLowerCase()
}

export function isAdvisorOf(
  project: ProjectSubject,
  viewer: Pick<ProjectViewer, 'role' | 'email'>,
) {
  return viewer.role === 'professor' && isProjectAdvisor(project, viewer.email)
}

export function isMemberOf(project: ProjectSubject, viewer: Pick<ProjectViewer, 'role' | 'email'>) {
  return (
    viewer.role === 'student' &&
    project.memberEmails.some((email) => normalize(email) === normalize(viewer.email))
  )
}

export function resolveProjectEditScope(
  project: ProjectSubject,
  viewer: Pick<ProjectViewer, 'role' | 'email'>,
): ProjectEditScope | null {
  if (viewer.role === 'admin') return 'admin'
  if (isAdvisorOf(project, viewer)) return 'full'
  return null
}

export function canViewProject(
  project: ProjectSubject,
  viewer: Pick<ProjectViewer, 'role' | 'email'> | null,
) {
  if (viewer?.role === 'admin') return true
  return isProjectActive(project)
}

export function canManageProgress(
  project: ProjectSubject,
  viewer: Pick<ProjectViewer, 'role' | 'email'>,
) {
  if (!isProjectActive(project) && viewer.role !== 'admin') return false
  if (project.status !== 'em_andamento') return false
  return viewer.role === 'admin' || isAdvisorOf(project, viewer)
}

export function canEditProgressTask(
  project: ProjectSubject,
  viewer: Pick<ProjectViewer, 'id' | 'role' | 'email'>,
  task: { createdByUserId: string },
) {
  if (!canManageProgress(project, viewer)) return false
  if (viewer.role === 'admin') return true
  return task.createdByUserId === viewer.id
}

export function canVerifyProject(
  project: ProjectSubject,
  viewer: Pick<ProjectViewer, 'role' | 'email'>,
) {
  if (project.status !== 'publicado' || !isProjectActive(project)) return false
  return viewer.role === 'admin' || isAdvisorOf(project, viewer)
}

export function canManageActivation(viewer: Pick<ProjectViewer, 'role'>) {
  return viewer.role === 'admin'
}
