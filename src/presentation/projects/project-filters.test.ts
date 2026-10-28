import { describe, expect, it } from 'vitest'
import type { ListedProject } from '@/application/projects/list-projects'
import { applyFilters, EMPTY_FILTERS, getChips, getFacets, removeChip } from './project-filters'

function makeProject(id: string, overrides: Partial<ListedProject> = {}): ListedProject {
  return {
    id,
    title: `Projeto ${id}`,
    summary: 'Resumo',
    cycle: '2026/1',
    semester: 3,
    advisor: { email: 'ana@cps.sp.gov.br', name: 'Profa. Ana' },
    memberEmails: [],
    languages: [],
    stack: [],
    theme: 'Educação',
    status: 'publicado',
    verified: false,
    cover: { icon: 'fi-rr-code', label: 'Teste', tone: 'slate' },
    related: false,
    ...overrides,
  }
}

const projects = [
  makeProject('a', { cycle: '2026/2' }),
  makeProject('b', { cycle: '2026/1' }),
  makeProject('c', { cycle: '2025/2' }),
  makeProject('d', { cycle: '2026/2' }),
]

describe('filtro de semestre letivo', () => {
  it('mostra todos os projetos quando nenhum semestre letivo está selecionado', () => {
    expect(applyFilters(projects, EMPTY_FILTERS)).toHaveLength(4)
  })

  it('filtra por um único semestre letivo', () => {
    const result = applyFilters(projects, { ...EMPTY_FILTERS, cycle: '2026/2' })
    expect(result.map((project) => project.id)).toEqual(['a', 'd'])
  })

  it('lista as opções do dropdown do mais recente para o mais antigo, com contagem', () => {
    const { cycles } = getFacets(projects)
    expect(cycles).toEqual([
      { value: '2026/2', count: 2 },
      { value: '2026/1', count: 1 },
      { value: '2025/2', count: 1 },
    ])
  })

  it('gera um único chip e o remove limpando o semestre letivo', () => {
    const filters = { ...EMPTY_FILTERS, cycle: '2026/1' }
    const chips = getChips(filters, [])
    expect(chips).toEqual([{ id: 'cycle', label: '2026/1' }])
    expect(removeChip(filters, 'cycle').cycle).toBe('')
  })
})
