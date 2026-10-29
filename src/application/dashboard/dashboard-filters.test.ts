import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/enterprise/entities/project'
import {
  ALL_OPTION,
  EMPTY_DASHBOARD_FILTERS,
  filterDashboardProjects,
  hasActiveDashboardFilters,
  listAdvisorOptions,
  listProjectOptions,
  listSemesterOptions,
} from './dashboard-filters'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p-1',
    title: 'Projeto',
    summary: 'Resumo',
    cycle: '2026/2',
    semester: 3,
    advisor: { email: 'ana@cps.sp.gov.br', name: 'Profa. Ana' },
    coAdvisors: [],
    memberEmails: [],
    languages: [],
    stack: [],
    theme: 'Tema',
    status: 'em_andamento',
    verified: false,
    cover: { icon: 'fi-rr-folder-open', label: 'Tema', tone: 'slate' },
    ...overrides,
  }
}

const projects = [
  makeProject({ id: 'a', title: 'Alfa', semester: 1, status: 'em_andamento' }),
  makeProject({ id: 'b', title: 'Beta', semester: 2, status: 'publicado' }),
  makeProject({
    id: 'c',
    title: 'Gama',
    semester: 2,
    status: 'publicado',
    verified: true,
    advisor: { email: 'caio@cps.sp.gov.br', name: 'Prof. Caio' },
    coAdvisors: [{ email: 'ANA@cps.sp.gov.br', name: 'Profa. Ana' }],
  }),
]

describe('filterDashboardProjects', () => {
  it('sem filtros devolve todos os projetos', () => {
    expect(filterDashboardProjects(projects, EMPTY_DASHBOARD_FILTERS)).toHaveLength(3)
    expect(hasActiveDashboardFilters(EMPTY_DASHBOARD_FILTERS)).toBe(false)
  })

  it('filtra por semestre', () => {
    const result = filterDashboardProjects(projects, { ...EMPTY_DASHBOARD_FILTERS, semester: '2' })
    expect(result.map((p) => p.id)).toEqual(['b', 'c'])
  })

  it('filtra por projeto específico', () => {
    const result = filterDashboardProjects(projects, { ...EMPTY_DASHBOARD_FILTERS, projectId: 'a' })
    expect(result.map((p) => p.id)).toEqual(['a'])
  })

  it('filtra por situação, incluindo concluídos e indicados', () => {
    const base = EMPTY_DASHBOARD_FILTERS
    expect(
      filterDashboardProjects(projects, { ...base, status: 'em_andamento' }).map((p) => p.id),
    ).toEqual(['a'])
    expect(
      filterDashboardProjects(projects, { ...base, status: 'publicado' }).map((p) => p.id),
    ).toEqual(['b', 'c'])
    expect(
      filterDashboardProjects(projects, { ...base, status: 'indicado' }).map((p) => p.id),
    ).toEqual(['c'])
  })

  it('filtra por orientador ou coorientador sem diferenciar maiúsculas', () => {
    const result = filterDashboardProjects(projects, {
      ...EMPTY_DASHBOARD_FILTERS,
      advisor: 'ana@cps.sp.gov.br',
    })
    expect(result.map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('combina filtros e permite ignorar um deles', () => {
    const filters = { ...EMPTY_DASHBOARD_FILTERS, semester: '2', projectId: 'a' }
    expect(filterDashboardProjects(projects, filters)).toEqual([])
    expect(filterDashboardProjects(projects, filters, ['projectId']).map((p) => p.id)).toEqual([
      'b',
      'c',
    ])
  })
})

describe('opções dos filtros', () => {
  it('lista semestres existentes com contagem', () => {
    expect(listSemesterOptions(projects)).toEqual([
      { value: '1', label: '1º semestre', count: 1 },
      { value: '2', label: '2º semestre', count: 2 },
    ])
  })

  it('lista projetos em ordem alfabética', () => {
    expect(listProjectOptions([projects[2], projects[0]]).map((o) => o.label)).toEqual([
      'Alfa',
      'Gama',
    ])
  })

  it('lista orientadores sem duplicar e conta os projetos de cada um', () => {
    const options = listAdvisorOptions(projects)
    expect(options.map((o) => [o.value, o.count])).toEqual([
      ['caio@cps.sp.gov.br', 1],
      ['ana@cps.sp.gov.br', 3],
    ])
    expect(ALL_OPTION).toBe('all')
  })
})
