import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/enterprise/entities/project'
import {
  bulkTaskCandidates,
  dedupeBulkTaskProjects,
  DEFAULT_BULK_TASK_FILTERS,
  explainBulkTaskIneligibility,
  filterBulkTaskProjects,
  listBulkTaskAdvisors,
  listBulkTaskCycles,
  selectableProjectIds,
} from './bulk-task-selection'

const professor = { role: 'professor' as const, email: 'principal@cps.sp.gov.br' }
const admin = { role: 'admin' as const, email: 'admin@cps.sp.gov.br' }

function makeProject(id: string, overrides: Partial<Project> = {}): Project {
  return {
    id,
    title: `Projeto ${id}`,
    summary: 'Resumo',
    cycle: '2026/2',
    semester: 3,
    advisor: { email: professor.email, name: 'Professora Principal' },
    coAdvisors: [],
    memberEmails: [],
    languages: [],
    stack: [],
    theme: 'Educação',
    status: 'em_andamento',
    verified: false,
    cover: { icon: 'fi-rr-folder-open', label: 'Educação', tone: 'slate' },
    ...overrides,
  }
}

const own = makeProject('own')
const ownSecondSemester = makeProject('own-2', { semester: 2, title: 'Gestão de Estoque' })
const done = makeProject('done', { status: 'publicado' })
const inactive = makeProject('inactive', { active: false })
const satellite = makeProject('satellite', {
  advisor: { email: 'outra@cps.sp.gov.br', name: 'Outra Professora' },
  coAdvisors: [{ email: professor.email, name: 'Professora Principal' }],
  cycle: '2026/1',
})
const foreign = makeProject('foreign', {
  advisor: { email: 'outra@cps.sp.gov.br', name: 'Outra Professora' },
})
const all = [own, ownSecondSemester, done, inactive, satellite, foreign]

describe('bulkTaskCandidates', () => {
  it('o professor vê só os projetos ativos que acompanha, como principal ou satélite', () => {
    expect(bulkTaskCandidates(all, professor).map((project) => project.id)).toEqual([
      'own',
      'own-2',
      'done',
      'satellite',
    ])
  })

  it('o administrador vê todos os projetos ativos do sistema', () => {
    expect(bulkTaskCandidates(all, admin).map((project) => project.id)).toEqual([
      'own',
      'own-2',
      'done',
      'satellite',
      'foreign',
    ])
  })
})

describe('projetos repetidos na lista', () => {
  it('mantém uma só entrada quando o mesmo id aparece duas vezes', () => {
    const repeated = [own, ownSecondSemester, { ...own }]

    expect(dedupeBulkTaskProjects(repeated).map((project) => project.id)).toEqual(['own', 'own-2'])
  })

  it('mantém a primeira entrada quando título, ciclo e semestre coincidem com outro id', () => {
    const stored = makeProject('uuid-real', { title: 'SALA — Agendamento' })
    const demo = makeProject('1', { title: 'sala — agendamento' })
    const otherSemester = makeProject('uuid-outro', { title: 'SALA — Agendamento', semester: 4 })

    expect(
      dedupeBulkTaskProjects([stored, demo, otherSemester]).map((project) => project.id),
    ).toEqual(['uuid-real', 'uuid-outro'])
  })

  it('os candidatos da atribuição em lote não repetem projetos', () => {
    const candidates = bulkTaskCandidates(
      [own, { ...own }, makeProject('copy', { title: own.title })],
      professor,
    )

    expect(candidates.map((project) => project.id)).toEqual(['own'])
  })
})

describe('explainBulkTaskIneligibility', () => {
  it('libera o orientador principal em projeto em andamento e o administrador em qualquer um', () => {
    expect(explainBulkTaskIneligibility(own, professor)).toBeNull()
    expect(explainBulkTaskIneligibility(done, admin)).toBeNull()
    expect(explainBulkTaskIneligibility(foreign, admin)).toBeNull()
  })

  it('explica por que o professor não pode atribuir', () => {
    expect(explainBulkTaskIneligibility(satellite, professor)).toBe(
      'Somente o orientador principal cria tarefas',
    )
    expect(explainBulkTaskIneligibility(done, professor)).toBe('Projeto concluído')
  })
})

describe('filterBulkTaskProjects', () => {
  const candidates = bulkTaskCandidates(all, professor)

  it('começa mostrando só os projetos em andamento', () => {
    const ids = filterBulkTaskProjects(candidates, DEFAULT_BULK_TASK_FILTERS, professor).map(
      (project) => project.id,
    )
    expect(ids).toEqual(['own', 'own-2', 'satellite'])
  })

  it('filtra por semestre e por ciclo', () => {
    const bySemester = filterBulkTaskProjects(
      candidates,
      { ...DEFAULT_BULK_TASK_FILTERS, semester: '2' },
      professor,
    )
    const byCycle = filterBulkTaskProjects(
      candidates,
      { ...DEFAULT_BULK_TASK_FILTERS, cycle: '2026/1' },
      professor,
    )

    expect(bySemester.map((project) => project.id)).toEqual(['own-2'])
    expect(byCycle.map((project) => project.id)).toEqual(['satellite'])
  })

  it('separa os projetos em que o professor é principal dos de satélite', () => {
    const principal = filterBulkTaskProjects(
      candidates,
      { ...DEFAULT_BULK_TASK_FILTERS, relation: 'principal' },
      professor,
    )
    const satellites = filterBulkTaskProjects(
      candidates,
      { ...DEFAULT_BULK_TASK_FILTERS, relation: 'satellite' },
      professor,
    )

    expect(principal.map((project) => project.id)).toEqual(['own', 'own-2'])
    expect(satellites.map((project) => project.id)).toEqual(['satellite'])
  })

  it('busca por título ignorando acentos e caixa', () => {
    const found = filterBulkTaskProjects(
      candidates,
      { ...DEFAULT_BULK_TASK_FILTERS, query: 'GESTAO' },
      professor,
    )
    expect(found.map((project) => project.id)).toEqual(['own-2'])
  })

  it('o administrador filtra por orientador e por situação', () => {
    const adminCandidates = bulkTaskCandidates(all, admin)

    const byAdvisor = filterBulkTaskProjects(
      adminCandidates,
      { ...DEFAULT_BULK_TASK_FILTERS, advisorEmail: 'outra@cps.sp.gov.br' },
      admin,
    )
    const concluded = filterBulkTaskProjects(
      adminCandidates,
      { ...DEFAULT_BULK_TASK_FILTERS, situation: 'publicado' },
      admin,
    )

    expect(byAdvisor.map((project) => project.id)).toEqual(['satellite', 'foreign'])
    expect(concluded.map((project) => project.id)).toEqual(['done'])
  })
})

describe('listas de apoio e seleção', () => {
  it('lista ciclos do mais recente ao mais antigo e orientadores em ordem alfabética', () => {
    const candidates = bulkTaskCandidates(all, admin)

    expect(listBulkTaskCycles(candidates)).toEqual(['2026/2', '2026/1'])
    expect(listBulkTaskAdvisors(candidates).map((advisor) => advisor.name)).toEqual([
      'Outra Professora',
      'Professora Principal',
    ])
  })

  it('só deixa selecionar os projetos em que a tarefa pode ser criada', () => {
    expect(selectableProjectIds([own, satellite, done], professor)).toEqual(['own'])
    expect(selectableProjectIds([own, satellite, done], admin)).toEqual([
      'own',
      'satellite',
      'done',
    ])
  })
})
