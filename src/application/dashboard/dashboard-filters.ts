import type { Project } from '@/domain/enterprise/entities/project'
import { getProjectAdvisors } from '@/domain/enterprise/entities/project-advisors'

export const ALL_OPTION = 'all'

export type DashboardStatusFilter = 'all' | 'em_andamento' | 'publicado' | 'indicado'

export interface DashboardFilters {
  semester: string
  projectId: string
  status: DashboardStatusFilter
  advisor: string
}

export const EMPTY_DASHBOARD_FILTERS: DashboardFilters = {
  semester: ALL_OPTION,
  projectId: ALL_OPTION,
  status: ALL_OPTION,
  advisor: ALL_OPTION,
}

export function hasActiveDashboardFilters(filters: DashboardFilters) {
  return (
    filters.semester !== ALL_OPTION ||
    filters.projectId !== ALL_OPTION ||
    filters.status !== ALL_OPTION ||
    filters.advisor !== ALL_OPTION
  )
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function filterDashboardProjects<T extends Project>(
  projects: T[],
  filters: DashboardFilters,
  ignore: Array<keyof DashboardFilters> = [],
): T[] {
  return projects.filter((project) => {
    if (
      !ignore.includes('semester') &&
      filters.semester !== ALL_OPTION &&
      String(project.semester) !== filters.semester
    ) {
      return false
    }
    if (
      !ignore.includes('projectId') &&
      filters.projectId !== ALL_OPTION &&
      project.id !== filters.projectId
    ) {
      return false
    }
    if (!ignore.includes('status') && filters.status !== ALL_OPTION) {
      if (filters.status === 'indicado') {
        if (project.status !== 'publicado' || !project.verified) return false
      } else if (project.status !== filters.status) {
        return false
      }
    }
    if (!ignore.includes('advisor') && filters.advisor !== ALL_OPTION) {
      const advisors = getProjectAdvisors(project)
      if (!advisors.some((advisor) => normalizeEmail(advisor.email) === filters.advisor)) {
        return false
      }
    }
    return true
  })
}

export interface DashboardFilterOption {
  value: string
  label: string
  count?: number
}

export function listSemesterOptions(projects: Project[]): DashboardFilterOption[] {
  const counts = new Map<number, number>()
  for (const project of projects) {
    counts.set(project.semester, (counts.get(project.semester) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([semester, count]) => ({
      value: String(semester),
      label: `${semester}º semestre`,
      count,
    }))
}

export function listProjectOptions(projects: Project[]): DashboardFilterOption[] {
  return [...projects]
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
    .map((project) => ({ value: project.id, label: project.title }))
}

export function listAdvisorOptions(projects: Project[]): DashboardFilterOption[] {
  const advisors = new Map<string, { name: string; count: number }>()
  for (const project of projects) {
    for (const advisor of getProjectAdvisors(project)) {
      const email = normalizeEmail(advisor.email)
      const entry = advisors.get(email) ?? { name: advisor.name, count: 0 }
      entry.count += 1
      advisors.set(email, entry)
    }
  }
  return [...advisors.entries()]
    .sort(([, a], [, b]) => a.name.localeCompare(b.name, 'pt-BR'))
    .map(([email, entry]) => ({ value: email, label: entry.name, count: entry.count }))
}

export const STATUS_FILTER_LABELS: Record<DashboardStatusFilter, string> = {
  all: 'Todas as situações',
  em_andamento: 'Em andamento',
  publicado: 'Concluídos',
  indicado: 'Concluídos e indicados',
}
