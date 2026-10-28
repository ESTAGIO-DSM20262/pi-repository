import type {
  ProjectAdministrationUpdateRecord,
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
  readonly activation = new Map<string, { active: boolean; changedAt: Date }>()
  readonly deletedIds: string[] = []

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

  async updateAsAdministrator(id: string, record: ProjectAdministrationUpdateRecord) {
    const current = this.projects.get(id)
    if (current) this.projects.set(id, { ...current, ...record })
  }

  async setActive(id: string, active: boolean, changedAt: Date) {
    this.activation.set(id, { active, changedAt })
  }

  async delete(id: string) {
    this.projects.delete(id)
    this.deletedIds.push(id)
    this.tasks.splice(0, this.tasks.length, ...this.tasks.filter((task) => task.projectId !== id))
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
