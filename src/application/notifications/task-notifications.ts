import type { NotificationType } from '@/domain/enterprise/entities/notification'
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

export interface TaskNotificationContent {
  type: NotificationType
  title: string
  message: string
}

const MAX_TASK_TITLE_LENGTH = 80

const STATUS_PHRASE: Record<ProjectProgressTaskStatus, string> = {
  pending: 'pendente',
  in_progress: 'em andamento',
  completed: 'concluída',
}

function normalize(email: string) {
  return email.trim().toLowerCase()
}

function shorten(value: string) {
  const text = value.trim().replace(/\s+/g, ' ')
  if (text.length <= MAX_TASK_TITLE_LENGTH) return text
  return `${text.slice(0, MAX_TASK_TITLE_LENGTH - 1)}…`
}

function studentRecipients(input: TaskNotificationInput) {
  const target = input.task.targetStudentEmail
  return target ? [target] : input.project.memberEmails
}

function advisorRecipients(project: TaskNotificationProject) {
  return [project.advisor.email, ...(project.coAdvisors ?? []).map((advisor) => advisor.email)]
}

function candidateEmails(input: TaskNotificationInput): string[] {
  const { event, actor, project } = input
  const everyone = [...studentRecipients(input), ...advisorRecipients(project)]
  if (event !== 'status_changed') return everyone
  if (actor.role === 'student') return advisorRecipients(project)
  if (actor.role === 'admin') return everyone
  return studentRecipients(input)
}

export function resolveTaskNotificationRecipients(input: TaskNotificationInput): string[] {
  const actorEmail = normalize(input.actor.email)
  const unique = new Set<string>()
  for (const email of candidateEmails(input)) {
    const normalized = normalize(email)
    if (normalized && normalized !== actorEmail) unique.add(normalized)
  }
  return [...unique]
}

export function buildTaskNotificationContent(
  input: TaskNotificationInput,
): TaskNotificationContent {
  const task = shorten(input.task.title)
  const project = shorten(input.project.title)
  const actor = input.actor.name.trim() || 'Alguém'

  if (input.event === 'created') {
    return {
      type: 'task_created',
      title: 'Nova tarefa',
      message: `${actor} criou a tarefa “${task}” no projeto ${project}.`,
    }
  }
  if (input.event === 'updated') {
    return {
      type: 'task_updated',
      title: 'Tarefa atualizada',
      message: `${actor} atualizou a tarefa “${task}” no projeto ${project}.`,
    }
  }
  const phrase = input.newStatus ? STATUS_PHRASE[input.newStatus] : 'outro status'
  return {
    type: 'task_status_changed',
    title: 'Status da tarefa alterado',
    message: `${actor} alterou a tarefa “${task}” para ${phrase} no projeto ${project}.`,
  }
}
