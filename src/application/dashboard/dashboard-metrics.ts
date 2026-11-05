import type { Project, ProjectTeamMember } from '@/domain/enterprise/entities/project'
import { getProjectAdvisors, isProjectActive } from '@/domain/enterprise/entities/project-advisors'
import type { ProjectProgressTaskStatus } from '@/domain/enterprise/entities/project-progress'

export const STALLED_AFTER_DAYS = 14
export const DUE_SOON_DAYS = 7
export const UPCOMING_WINDOW_DAYS = 14

const DAY_IN_MS = 86_400_000

export interface MonthlyRegistration {
  key: string
  label: string
  count: number
}

export interface DashboardTask {
  id: string
  projectId: string
  title: string
  versionMajor: number
  versionMinor: number
  status: ProjectProgressTaskStatus
  targetStudentEmail: string | null
  dueDate: string | null
  updatedAt: string
}

export interface TaskSummary {
  total: number
  pending: number
  inProgress: number
  completed: number
  open: number
  overdue: number
  dueSoon: number
  completionRate: number
}

export interface ProjectProgressRow {
  projectId: string
  title: string
  semester: number
  advisorName: string
  total: number
  completed: number
  inProgress: number
  pending: number
  overdue: number
  percent: number
  nextDueDate: string | null
  lastActivityDays: number | null
  stalled: boolean
  withoutTasks: boolean
  readyToConclude: boolean
}

export interface TaskDeadlineRow {
  taskId: string
  projectId: string
  projectTitle: string
  title: string
  version: string
  dueDate: string
  daysUntilDue: number
  status: ProjectProgressTaskStatus
  studentName: string | null
}

export interface StudentWorkloadRow {
  email: string
  name: string
  open: number
  overdue: number
  completed: number
  total: number
}

export interface SemesterDistribution {
  semester: number
  ongoing: number
  completed: number
}

export interface AwaitingIndicationRow {
  projectId: string
  title: string
  semester: number
}

export interface ProfessorDashboardMetrics {
  projects: {
    total: number
    ongoing: number
    completed: number
    indicated: number
    awaitingMyIndication: number
    stalled: number
    withoutTasks: number
    readyToConclude: number
  }
  tasks: TaskSummary
  semesters: SemesterDistribution[]
  progress: ProjectProgressRow[]
  deadlines: TaskDeadlineRow[]
  students: StudentWorkloadRow[]
  awaitingIndication: AwaitingIndicationRow[]
}

export interface AdvisorLoadRow {
  email: string
  name: string
  ongoing: number
  completed: number
  overdue: number
}

export interface AdminDashboardMetrics {
  projects: {
    total: number
    ongoing: number
    completed: number
    indicated: number
    deactivated: number
    awaitingIndication: number
    ongoingWithTasks: number
    ongoingWithoutTasks: number
  }
  tasks: TaskSummary
  semesters: SemesterDistribution[]
  attention: ProjectProgressRow[]
  advisorLoad: AdvisorLoadRow[]
  people: {
    studentsWithoutProject: number
    professorsWithoutProject: number
    activeStudents: number
    activeProfessors: number
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function dayNumber(date: string) {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS)
}

export function daysFromToday(date: string, today: string) {
  return dayNumber(date) - dayNumber(today)
}

export function isTaskOpen(task: Pick<DashboardTask, 'status'>) {
  return task.status !== 'completed'
}

export function isTaskOverdue(task: Pick<DashboardTask, 'status' | 'dueDate'>, today: string) {
  return isTaskOpen(task) && task.dueDate !== null && daysFromToday(task.dueDate, today) < 0
}

export function isTaskDueSoon(task: Pick<DashboardTask, 'status' | 'dueDate'>, today: string) {
  if (!isTaskOpen(task) || task.dueDate === null) return false
  const days = daysFromToday(task.dueDate, today)
  return days >= 0 && days <= DUE_SOON_DAYS
}

export function summarizeTasks(tasks: DashboardTask[], today: string): TaskSummary {
  let pending = 0
  let inProgress = 0
  let completed = 0
  let overdue = 0
  let dueSoon = 0
  for (const task of tasks) {
    if (task.status === 'pending') pending += 1
    else if (task.status === 'in_progress') inProgress += 1
    else completed += 1
    if (isTaskOverdue(task, today)) overdue += 1
    if (isTaskDueSoon(task, today)) dueSoon += 1
  }
  const total = tasks.length
  return {
    total,
    pending,
    inProgress,
    completed,
    open: pending + inProgress,
    overdue,
    dueSoon,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
  }
}

function groupTasksByProject(tasks: DashboardTask[]) {
  const grouped = new Map<string, DashboardTask[]>()
  for (const task of tasks) {
    const list = grouped.get(task.projectId)
    if (list) list.push(task)
    else grouped.set(task.projectId, [task])
  }
  return grouped
}

function buildProjectRow(
  project: Project,
  tasks: DashboardTask[],
  today: string,
  now: Date,
): ProjectProgressRow {
  const summary = summarizeTasks(tasks, today)
  let lastActivity = 0
  let nextDueDate: string | null = null
  for (const task of tasks) {
    const updated = new Date(task.updatedAt).getTime()
    if (Number.isFinite(updated) && updated > lastActivity) lastActivity = updated
    if (isTaskOpen(task) && task.dueDate !== null && daysFromToday(task.dueDate, today) >= 0) {
      if (nextDueDate === null || task.dueDate < nextDueDate) nextDueDate = task.dueDate
    }
  }
  const lastActivityDays = lastActivity
    ? Math.max(0, Math.floor((now.getTime() - lastActivity) / DAY_IN_MS))
    : null
  const ongoing = project.status === 'em_andamento'

  return {
    projectId: project.id,
    title: project.title,
    semester: project.semester,
    advisorName: project.advisor.name,
    total: summary.total,
    completed: summary.completed,
    inProgress: summary.inProgress,
    pending: summary.pending,
    overdue: summary.overdue,
    percent: summary.completionRate,
    nextDueDate,
    lastActivityDays,
    stalled:
      ongoing &&
      summary.open > 0 &&
      lastActivityDays !== null &&
      lastActivityDays >= STALLED_AFTER_DAYS,
    withoutTasks: ongoing && summary.total === 0,
    readyToConclude: ongoing && summary.total > 0 && summary.open === 0,
  }
}

function attentionScore(row: ProjectProgressRow) {
  if (row.overdue > 0) return 4
  if (row.stalled) return 3
  if (row.withoutTasks) return 2
  if (row.readyToConclude) return 1
  return 0
}

export function compareByAttention(a: ProjectProgressRow, b: ProjectProgressRow) {
  const byScore = attentionScore(b) - attentionScore(a)
  if (byScore !== 0) return byScore
  if (a.overdue !== b.overdue) return b.overdue - a.overdue
  if (a.percent !== b.percent) return a.percent - b.percent
  return a.title.localeCompare(b.title, 'pt-BR')
}

function buildSemesterDistribution(projects: Project[]): SemesterDistribution[] {
  return [1, 2, 3, 4, 5, 6].map((semester) => {
    const inSemester = projects.filter((project) => project.semester === semester)
    return {
      semester,
      ongoing: inSemester.filter((project) => project.status === 'em_andamento').length,
      completed: inSemester.filter((project) => project.status === 'publicado').length,
    }
  })
}

function teamMembersOf(project: Project): ProjectTeamMember[] {
  return project.teamMembers?.length ? project.teamMembers : (project.publicDetails?.team ?? [])
}

function emailLocalPart(email: string) {
  return email.split('@')[0] ?? email
}

function formatVersion(task: Pick<DashboardTask, 'versionMajor' | 'versionMinor'>) {
  return `v${task.versionMajor}.${task.versionMinor}`
}

function resolveStudentNames(projects: Project[]) {
  const names = new Map<string, string>()
  for (const project of projects) {
    for (const member of teamMembersOf(project)) {
      if (member.studentEmail) names.set(normalizeEmail(member.studentEmail), member.name)
    }
  }
  return names
}

function buildDeadlines(
  projects: Project[],
  tasks: DashboardTask[],
  today: string,
  names: Map<string, string>,
  limit: number,
): TaskDeadlineRow[] {
  const titles = new Map(projects.map((project) => [project.id, project.title]))
  return tasks
    .filter(
      (task) =>
        isTaskOpen(task) &&
        task.dueDate !== null &&
        daysFromToday(task.dueDate, today) <= UPCOMING_WINDOW_DAYS,
    )
    .sort(
      (a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '') || a.title.localeCompare(b.title),
    )
    .slice(0, limit)
    .map((task) => ({
      taskId: task.id,
      projectId: task.projectId,
      projectTitle: titles.get(task.projectId) ?? 'Projeto',
      title: task.title,
      version: formatVersion(task),
      dueDate: task.dueDate as string,
      daysUntilDue: daysFromToday(task.dueDate as string, today),
      status: task.status,
      studentName: task.targetStudentEmail
        ? (names.get(normalizeEmail(task.targetStudentEmail)) ??
          emailLocalPart(task.targetStudentEmail))
        : null,
    }))
}

function buildStudentWorkload(
  tasks: DashboardTask[],
  names: Map<string, string>,
  today: string,
  limit: number,
): StudentWorkloadRow[] {
  const rows = new Map<string, StudentWorkloadRow>()
  for (const task of tasks) {
    if (!task.targetStudentEmail) continue
    const email = normalizeEmail(task.targetStudentEmail)
    const row = rows.get(email) ?? {
      email,
      name: names.get(email) ?? emailLocalPart(email),
      open: 0,
      overdue: 0,
      completed: 0,
      total: 0,
    }
    row.total += 1
    if (task.status === 'completed') row.completed += 1
    else row.open += 1
    if (isTaskOverdue(task, today)) row.overdue += 1
    rows.set(email, row)
  }
  return [...rows.values()]
    .sort(
      (a, b) => b.overdue - a.overdue || b.open - a.open || a.name.localeCompare(b.name, 'pt-BR'),
    )
    .slice(0, limit)
}

interface ProfessorMetricsInput {
  projects: Project[]
  tasks: DashboardTask[]
  indicatedProjectIds: string[]
  today: string
  now: Date
}

export function buildProfessorDashboardMetrics({
  projects,
  tasks,
  indicatedProjectIds,
  today,
  now,
}: ProfessorMetricsInput): ProfessorDashboardMetrics {
  const followed = projects.filter(isProjectActive)
  const followedIds = new Set(followed.map((project) => project.id))
  const followedTasks = tasks.filter((task) => followedIds.has(task.projectId))
  const tasksByProject = groupTasksByProject(followedTasks)
  const indicated = new Set(indicatedProjectIds)
  const names = resolveStudentNames(followed)

  const ongoingProjects = followed.filter((project) => project.status === 'em_andamento')
  const completedProjects = followed.filter((project) => project.status === 'publicado')
  const progress = ongoingProjects
    .map((project) => buildProjectRow(project, tasksByProject.get(project.id) ?? [], today, now))
    .sort(compareByAttention)
  const awaitingIndication = completedProjects
    .filter((project) => !project.verified && !indicated.has(project.id))
    .map((project) => ({
      projectId: project.id,
      title: project.title,
      semester: project.semester,
    }))

  return {
    projects: {
      total: followed.length,
      ongoing: ongoingProjects.length,
      completed: completedProjects.length,
      indicated: completedProjects.filter((project) => project.verified).length,
      awaitingMyIndication: awaitingIndication.length,
      stalled: progress.filter((row) => row.stalled).length,
      withoutTasks: progress.filter((row) => row.withoutTasks).length,
      readyToConclude: progress.filter((row) => row.readyToConclude).length,
    },
    tasks: summarizeTasks(followedTasks, today),
    semesters: buildSemesterDistribution(followed),
    progress,
    deadlines: buildDeadlines(followed, followedTasks, today, names, 10),
    students: buildStudentWorkload(followedTasks, names, today, 8),
    awaitingIndication,
  }
}

interface AdminMetricsInput {
  projects: Project[]
  tasks: DashboardTask[]
  activeStudentEmails: string[]
  activeProfessorEmails: string[]
  today: string
  now: Date
}

export function buildAdminDashboardMetrics({
  projects,
  tasks,
  activeStudentEmails,
  activeProfessorEmails,
  today,
  now,
}: AdminMetricsInput): AdminDashboardMetrics {
  const active = projects.filter(isProjectActive)
  const activeIds = new Set(active.map((project) => project.id))
  const activeTasks = tasks.filter((task) => activeIds.has(task.projectId))
  const tasksByProject = groupTasksByProject(activeTasks)

  const ongoing = active.filter((project) => project.status === 'em_andamento')
  const completed = active.filter((project) => project.status === 'publicado')
  const rows = ongoing.map((project) =>
    buildProjectRow(project, tasksByProject.get(project.id) ?? [], today, now),
  )

  const advisors = new Map<string, AdvisorLoadRow>()
  const rowById = new Map(rows.map((row) => [row.projectId, row]))
  for (const project of active) {
    for (const advisor of getProjectAdvisors(project)) {
      const email = normalizeEmail(advisor.email)
      const entry = advisors.get(email) ?? {
        email,
        name: advisor.name,
        ongoing: 0,
        completed: 0,
        overdue: 0,
      }
      if (project.status === 'em_andamento') {
        entry.ongoing += 1
        entry.overdue += rowById.get(project.id)?.overdue ?? 0
      } else {
        entry.completed += 1
      }
      advisors.set(email, entry)
    }
  }

  const studentsInProjects = new Set<string>()
  const professorsInProjects = new Set<string>()
  for (const project of active) {
    for (const email of project.memberEmails) studentsInProjects.add(normalizeEmail(email))
    for (const advisor of getProjectAdvisors(project)) {
      professorsInProjects.add(normalizeEmail(advisor.email))
    }
  }
  const studentEmails = [...new Set(activeStudentEmails.map(normalizeEmail))]
  const professorEmails = [...new Set(activeProfessorEmails.map(normalizeEmail))]

  return {
    projects: {
      total: active.length,
      ongoing: ongoing.length,
      completed: completed.length,
      indicated: completed.filter((project) => project.verified).length,
      deactivated: projects.length - active.length,
      awaitingIndication: completed.filter((project) => !project.verified).length,
      ongoingWithTasks: rows.filter((row) => row.total > 0).length,
      ongoingWithoutTasks: rows.filter((row) => row.withoutTasks).length,
    },
    tasks: summarizeTasks(activeTasks, today),
    semesters: buildSemesterDistribution(active),
    attention: rows
      .filter((row) => row.overdue > 0 || row.stalled || row.withoutTasks)
      .sort(compareByAttention)
      .slice(0, 6),
    advisorLoad: [...advisors.values()]
      .sort(
        (a, b) =>
          b.ongoing - a.ongoing ||
          b.overdue - a.overdue ||
          b.completed - a.completed ||
          a.name.localeCompare(b.name, 'pt-BR'),
      )
      .slice(0, 6),
    people: {
      studentsWithoutProject: studentEmails.filter((email) => !studentsInProjects.has(email))
        .length,
      professorsWithoutProject: professorEmails.filter((email) => !professorsInProjects.has(email))
        .length,
      activeStudents: studentEmails.length,
      activeProfessors: professorEmails.length,
    },
  }
}

export interface StudentDashboardMetrics {
  projects: {
    total: number
    ongoing: number
    completed: number
    indicated: number
  }
  tasks: TaskSummary
  progress: ProjectProgressRow[]
  deadlines: TaskDeadlineRow[]
}

interface StudentMetricsInput {
  projects: Project[]
  tasks: DashboardTask[]
  email: string
  today: string
  now: Date
}

export function buildStudentDashboardMetrics({
  projects,
  tasks,
  email,
  today,
  now,
}: StudentMetricsInput): StudentDashboardMetrics {
  const mine = normalizeEmail(email)
  const followed = projects.filter(isProjectActive)
  const followedIds = new Set(followed.map((project) => project.id))
  const projectTasks = tasks.filter((task) => followedIds.has(task.projectId))
  const myTasks = projectTasks.filter(
    (task) => task.targetStudentEmail === null || normalizeEmail(task.targetStudentEmail) === mine,
  )
  const tasksByProject = groupTasksByProject(projectTasks)
  const names = resolveStudentNames(followed)

  const ongoingProjects = followed.filter((project) => project.status === 'em_andamento')
  const completedProjects = followed.filter((project) => project.status === 'publicado')

  return {
    projects: {
      total: followed.length,
      ongoing: ongoingProjects.length,
      completed: completedProjects.length,
      indicated: completedProjects.filter((project) => project.verified).length,
    },
    tasks: summarizeTasks(myTasks, today),
    progress: ongoingProjects
      .map((project) => buildProjectRow(project, tasksByProject.get(project.id) ?? [], today, now))
      .sort(compareByAttention),
    deadlines: buildDeadlines(followed, myTasks, today, names, 8),
  }
}
