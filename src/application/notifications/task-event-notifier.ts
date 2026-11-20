import type { TaskNotificationInput } from './task-notifications'

export type TaskEventNotification = TaskNotificationInput & {
  projectId: string
  taskId: string
}

export interface TaskEventNotifier {
  notify(event: TaskEventNotification): Promise<void>
}
