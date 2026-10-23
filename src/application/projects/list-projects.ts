import type { UseCase } from '@/core/application/use-case'
import type { Project } from '@/domain/enterprise/entities/project'
import type { Role } from '@/domain/enterprise/entities/role'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'

export type ViewerRole = Role

export interface Viewer {
  email: string
  role: ViewerRole
}

export interface ListedProject extends Project {
  related: boolean
}

interface ListProjectsInput {
  viewer: Viewer | null
}

interface ListProjectsOutput {
  projects: ListedProject[]
}

function isRelated(project: Project, viewer: Viewer | null): boolean {
  if (!viewer) return false
  const email = viewer.email.trim().toLowerCase()
  if (viewer.role === 'student')
    return project.memberEmails.some((memberEmail) => memberEmail.trim().toLowerCase() === email)
  if (viewer.role === 'professor') return project.advisor.email.trim().toLowerCase() === email
  return false
}

function canSee(project: Project, viewer: Viewer | null): boolean {
  if (project.status === 'publicado') return true
  if (!viewer) return false
  return viewer.role === 'admin' || isRelated(project, viewer)
}

export class ListProjectsUseCase implements UseCase<ListProjectsInput, ListProjectsOutput> {
  constructor(private readonly projectRepository: ProjectReader) {}

  async execute({ viewer }: ListProjectsInput): Promise<ListProjectsOutput> {
    const all = await this.projectRepository.findAll()
    const projects = all
      .filter((project) => canSee(project, viewer))
      .map((project) => ({ ...project, related: isRelated(project, viewer) }))

    return { projects }
  }
}
