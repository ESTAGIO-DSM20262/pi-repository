import type { ProjectProgressTaskStatus } from '@/domain/enterprise/entities/project-progress'
import type { Role } from '@/domain/enterprise/entities/role'

export type TaskNotificationEvent = 'created' | 'updated' | 'status_changed'

export interface TaskNotificationProject {
  title: string
  advisor: { email: string }
  coAdvisors?: Array<{ email: string }>
  memberEmails: string[]
}

export interface TaskNotificationInput {
  event: TaskNotificationEvent
  project: TaskNotificationProject
  task: { title: string; targetStudentEmail: string | null }
  actor: { email: string; name: string; role: Role }
  newStatus?: ProjectProgressTaskStatus
}

export type TaskEventNotification = TaskNotificationInput & {
  projectId: string
  taskId: string
}

export interface TaskEventNotifier {
  notify(event: TaskEventNotification): Promise<void>
}
