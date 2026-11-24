export const NOTIFICATION_TYPES = ['task_created', 'task_updated', 'task_status_changed'] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  projectId: string | null
  taskId: string | null
  read: boolean
  createdAt: string
}
