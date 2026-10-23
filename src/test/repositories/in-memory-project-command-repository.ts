import type { ProjectPublicDetails } from '@/domain/enterprise/entities/project'
import type {
  ProjectCreateRecord,
  ProjectFullUpdateRecord,
  ProjectRepository,
  ProjectRevisionCreateRecord,
  ProjectTaskCreateRecord,
} from '@/domain/enterprise/repositories/project-repository'

export class InMemoryProjectCommandRepository implements ProjectRepository {
  readonly projects = new Map<string, ProjectCreateRecord>()
  readonly tasks: ProjectTaskCreateRecord[] = []
  readonly revisions: ProjectRevisionCreateRecord[] = []

  async create(
    project: ProjectCreateRecord,
    tasks: ProjectTaskCreateRecord[],
    revisions: ProjectRevisionCreateRecord[],
  ) {
    this.projects.set(project.id, project)
    this.tasks.push(...tasks)
    this.revisions.push(...revisions)
  }

  async update(id: string, record: ProjectFullUpdateRecord) {
    const current = this.projects.get(id)
    if (current) this.projects.set(id, { ...current, ...record })
  }

  async updateArtifacts(id: string, publicDetails: ProjectPublicDetails) {
    const current = this.projects.get(id)
    if (current) this.projects.set(id, { ...current, publicDetails })
  }

  async hasTasksAssignedToMembers(projectId: string, memberEmails: string[]) {
    const normalized = new Set(memberEmails.map((email) => email.toLowerCase()))
    return this.tasks.some(
      (task) =>
        task.projectId === projectId &&
        Boolean(task.targetStudentEmail && normalized.has(task.targetStudentEmail.toLowerCase())),
    )
  }
}
