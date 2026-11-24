import {
  DUE_SOON_DAYS,
  daysFromToday,
  isTaskDueSoon,
  isTaskOverdue,
} from '@/application/dashboard/dashboard-metrics'
import type { Project } from '@/domain/enterprise/entities/project'
import { isProjectActive } from '@/domain/enterprise/entities/project-advisors'
import type { ProjectProgressTaskStatus } from '@/domain/enterprise/entities/project-progress'
import { canManageProgress, isMemberOf, type ProjectViewer } from './project-permissions'

export type TaskDisplayStatus = ProjectProgressTaskStatus | 'overdue'

type TaskDates = { status: ProjectProgressTaskStatus; dueDate: string | null }
type ProjectSubject = Pick<Project, 'advisor' | 'coAdvisors' | 'status' | 'active' | 'memberEmails'>

export const TASK_STATUS_LABEL: Record<ProjectProgressTaskStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluída',
}

export const TASK_STATUS_ACTIONS: Record<
  ProjectProgressTaskStatus,
  Array<{ to: ProjectProgressTaskStatus; label: string; primary: boolean }>
> = {
  pending: [
    { to: 'in_progress', label: 'Iniciar tarefa', primary: true },
    { to: 'completed', label: 'Marcar como concluída', primary: false },
  ],
  in_progress: [
    { to: 'completed', label: 'Marcar como concluída', primary: true },
    { to: 'pending', label: 'Voltar para pendente', primary: false },
  ],
  completed: [{ to: 'in_progress', label: 'Reabrir tarefa', primary: true }],
}

export function todayInSaoPaulo(now: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
}

export function getTaskDisplayStatus(task: TaskDates, today: string): TaskDisplayStatus {
  return isTaskOverdue(task, today) ? 'overdue' : task.status
}

export function describeTaskDeadline(task: TaskDates, today: string): string | null {
  if (task.status === 'completed' || task.dueDate === null) return null
  const days = daysFromToday(task.dueDate, today)
  if (days < 0) return days === -1 ? 'Atrasada há 1 dia' : `Atrasada há ${-days} dias`
  if (days === 0) return 'Vence hoje'
  if (days === 1) return 'Vence amanhã'
  if (days <= DUE_SOON_DAYS) return `Vence em ${days} dias`
  return null
}

export interface TaskProgressBar {
  total: number
  completed: number
  overdue: number
  inProgress: number
  pending: number
  dueSoon: number
  completionRate: number
  allCompleted: boolean
}

export function buildTaskProgressBar(tasks: TaskDates[], today: string): TaskProgressBar {
  let completed = 0
  let overdue = 0
  let inProgress = 0
  let pending = 0
  let dueSoon = 0
  for (const task of tasks) {
    const display = getTaskDisplayStatus(task, today)
    if (display === 'completed') completed += 1
    else if (display === 'overdue') overdue += 1
    else if (display === 'in_progress') inProgress += 1
    else pending += 1
    if (isTaskDueSoon(task, today)) dueSoon += 1
  }
  const total = tasks.length
  return {
    total,
    completed,
    overdue,
    inProgress,
    pending,
    dueSoon,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    allCompleted: total > 0 && completed === total,
  }
}

export function canChangeTaskStatus(
  project: ProjectSubject,
  viewer: Pick<ProjectViewer, 'role' | 'email'>,
  task: { targetStudentEmail: string | null },
) {
  if (canManageProgress(project, viewer)) return true
  if (viewer.role !== 'student') return false
  if (!isProjectActive(project) || project.status !== 'em_andamento') return false
  if (!isMemberOf(project, viewer)) return false
  return (
    task.targetStudentEmail === null ||
    task.targetStudentEmail.trim().toLowerCase() === viewer.email.trim().toLowerCase()
  )
}

export function statusChangeNote(from: ProjectProgressTaskStatus, to: ProjectProgressTaskStatus) {
  return `Status alterado de ${TASK_STATUS_LABEL[from]} para ${TASK_STATUS_LABEL[to]}.`
}
