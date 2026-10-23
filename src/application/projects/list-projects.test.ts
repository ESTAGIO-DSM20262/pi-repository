import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/enterprise/entities/project'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'
import { ListProjectsUseCase, type Viewer } from './list-projects'

function makeProject(id: string, overrides: Partial<Project> = {}): Project {
  return {
    id,
    title: `Projeto ${id}`,
    summary: 'Resumo',
    cycle: '2026/1',
    semester: 5,
    advisor: { email: 'carlos.pereira@cps.sp.gov.br', name: 'Prof. Carlos P.' },
    memberEmails: [],
    languages: [],
    stack: [],
    theme: 'Gestão & Processos',
    status: 'publicado',
    verified: false,
    cover: { icon: 'fi-rr-code', label: 'Teste', tone: 'slate' },
    ...overrides,
  }
}

class InMemoryProjectRepository implements ProjectReader {
  constructor(private readonly items: Project[]) {}

  async findAll() {
    return this.items
  }

  async findById(id: string) {
    return this.items.find((item) => item.id === id) ?? null
  }
}

const joao: Viewer = { email: 'joao.silva@aluno.cps.sp.gov.br', role: 'student' }
const carlos: Viewer = { email: 'carlos.pereira@cps.sp.gov.br', role: 'professor' }
const ana: Viewer = { email: 'ana.lima@cps.sp.gov.br', role: 'professor' }
const admin: Viewer = { email: 'coord@cps.sp.gov.br', role: 'admin' }

const repository = new InMemoryProjectRepository([
  makeProject('publico'),
  makeProject('do-joao', { memberEmails: [joao.email], status: 'em_andamento' }),
  makeProject('rascunho', { memberEmails: ['outro@aluno.cps.sp.gov.br'], status: 'em_andamento' }),
])
const useCase = new ListProjectsUseCase(repository)
const ids = (list: { id: string }[]) => list.map((p) => p.id).sort()

describe('ListProjectsUseCase', () => {
  it('visitante vê apenas projetos publicados', async () => {
    const { projects } = await useCase.execute({ viewer: null })

    expect(ids(projects)).toEqual(['publico'])
    expect(projects.every((p) => !p.related)).toBe(true)
  })

  it('aluno vê publicados e os próprios em andamento, marcando os relacionados', async () => {
    const { projects } = await useCase.execute({ viewer: joao })

    expect(ids(projects)).toEqual(['do-joao', 'publico'])
    expect(projects.find((p) => p.id === 'do-joao')?.related).toBe(true)
    expect(projects.find((p) => p.id === 'publico')?.related).toBe(false)
  })

  it('professor vê os projetos que orienta, inclusive em andamento', async () => {
    const { projects } = await useCase.execute({ viewer: carlos })

    expect(ids(projects)).toEqual(['do-joao', 'publico', 'rascunho'])
    expect(projects.every((p) => p.related === (p.advisor.email === carlos.email))).toBe(true)
  })

  it('professor não vê rascunhos de projetos que não orienta', async () => {
    const other = new ListProjectsUseCase(
      new InMemoryProjectRepository([
        makeProject('meu', {
          advisor: { email: ana.email, name: 'Profa. Ana L.' },
          status: 'em_andamento',
        }),
        makeProject('alheio', { status: 'em_andamento' }),
      ]),
    )
    const { projects } = await other.execute({ viewer: ana })

    expect(ids(projects)).toEqual(['meu'])
  })

  it('admin vê todos e nenhum projeto é marcado como relacionado', async () => {
    const { projects } = await useCase.execute({ viewer: admin })

    expect(ids(projects)).toEqual(['do-joao', 'publico', 'rascunho'])
    expect(projects.every((p) => !p.related)).toBe(true)
  })

  it('ignora diferenças de maiúsculas no e-mail do usuário', async () => {
    const { projects } = await useCase.execute({
      viewer: { email: ' Joao.Silva@Aluno.CPS.sp.gov.br ', role: 'student' },
    })

    expect(projects.find((p) => p.id === 'do-joao')?.related).toBe(true)
  })
})
