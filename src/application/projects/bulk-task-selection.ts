import type { Project } from '@/domain/enterprise/entities/project'
import { isProjectActive } from '@/domain/enterprise/entities/project-advisors'
import { dedupeProjects } from './dedupe-projects'
import { canManageProgress, isAdvisorOf, isPrincipalAdvisorOf } from './project-permissions'

export interface BulkTaskViewer {
  role: 'professor' | 'admin'
  email: string
}

export type BulkTaskRelation = 'all' | 'principal' | 'satellite'
export type BulkTaskSituation = 'all' | 'em_andamento' | 'publicado'

export interface BulkTaskFilters {
  query: string
  semester: string
  cycle: string
  advisorEmail: string
  situation: BulkTaskSituation
  relation: BulkTaskRelation
}

export const DEFAULT_BULK_TASK_FILTERS: BulkTaskFilters = {
  query: '',
  semester: 'all',
  cycle: 'all',
  advisorEmail: 'all',
  situation: 'em_andamento',
  relation: 'all',
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

export function dedupeBulkTaskProjects(projects: Project[]): Project[] {
  return dedupeProjects(projects)
}

export function bulkTaskCandidates(projects: Project[], viewer: BulkTaskViewer): Project[] {
  return dedupeBulkTaskProjects(
    projects.filter(
      (project) =>
        isProjectActive(project) && (viewer.role === 'admin' || isAdvisorOf(project, viewer)),
    ),
  )
}

export function explainBulkTaskIneligibility(
  project: Project,
  viewer: BulkTaskViewer,
): string | null {
  if (canManageProgress(project, viewer)) return null
  if (project.status !== 'em_andamento') return 'Projeto concluído'
  return 'Somente o orientador principal cria tarefas'
}

export function filterBulkTaskProjects(
  candidates: Project[],
  filters: BulkTaskFilters,
  viewer: BulkTaskViewer,
): Project[] {
  const query = normalizeText(filters.query)
  return candidates.filter((project) => {
    if (filters.situation !== 'all' && project.status !== filters.situation) return false
    if (filters.semester !== 'all' && String(project.semester) !== filters.semester) return false
    if (filters.cycle !== 'all' && project.cycle !== filters.cycle) return false
    if (
      filters.advisorEmail !== 'all' &&
      project.advisor.email.trim().toLowerCase() !== filters.advisorEmail
    ) {
      return false
    }
    if (filters.relation === 'principal' && !isPrincipalAdvisorOf(project, viewer)) return false
    if (
      filters.relation === 'satellite' &&
      (isPrincipalAdvisorOf(project, viewer) || !isAdvisorOf(project, viewer))
    ) {
      return false
    }
    if (!query) return true
    const haystack = `${project.title} ${project.advisor.name} ${project.theme}`
    return normalizeText(haystack).includes(query)
  })
}

export function listBulkTaskCycles(candidates: Project[]): string[] {
  return [...new Set(candidates.map((project) => project.cycle))].sort((first, second) =>
    second.localeCompare(first),
  )
}

export function listBulkTaskAdvisors(candidates: Project[]) {
  const advisors = new Map<string, string>()
  for (const project of candidates) {
    advisors.set(project.advisor.email.trim().toLowerCase(), project.advisor.name)
  }
  return [...advisors.entries()]
    .map(([email, name]) => ({ email, name }))
    .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))
}

export function selectableProjectIds(projects: Project[], viewer: BulkTaskViewer): string[] {
  return projects
    .filter((project) => explainBulkTaskIneligibility(project, viewer) === null)
    .map((project) => project.id)
}
