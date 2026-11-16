import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/enterprise/entities/project'
import { InMemoryProjectCommandRepository } from '@/test/repositories/in-memory-project-command-repository'
import { InMemoryProjectReader } from '@/test/repositories/in-memory-project-reader'
import { SetProjectActivationUseCase } from './set-project-activation-use-case'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p-1',
    title: 'Projeto',
    summary: 'Resumo',
    cycle: '2026/2',
    semester: 3,
    advisor: { email: 'prof@cps.sp.gov.br', name: 'Prof.' },
    coAdvisors: [{ email: 'satelite@cps.sp.gov.br', name: 'Satélite' }],
    memberEmails: [],
    languages: [],
    stack: [],
    theme: 'Tema',
    status: 'publicado',
    verified: false,
    cover: { icon: 'fi-rr-folder-open', label: 'Tema', tone: 'slate' },
    ...overrides,
  }
}

const now = new Date('2026-10-27T12:00:00Z')

function setup() {
  const repository = new InMemoryProjectCommandRepository()
  const useCase = new SetProjectActivationUseCase(
    new InMemoryProjectReader([makeProject()]),
    repository,
    () => now,
  )
  return { repository, useCase }
}

const principalViewer = { role: 'professor' as const, email: 'Prof@cps.sp.gov.br' }
const satelliteViewer = { role: 'professor' as const, email: 'satelite@cps.sp.gov.br' }
const adminViewer = { role: 'admin' as const, email: 'admin@cps.sp.gov.br' }

describe('SetProjectActivationUseCase', () => {
  it('permite ao administrador desativar e reativar o projeto', async () => {
    const { repository, useCase } = setup()

    const off = await useCase.execute({ viewer: adminViewer, projectId: 'p-1', active: false })
    expect(off.isRight()).toBe(true)
    expect(repository.activation.get('p-1')).toEqual({ active: false, changedAt: now })

    const on = await useCase.execute({ viewer: adminViewer, projectId: 'p-1', active: true })
    expect(on.isRight()).toBe(true)
    expect(repository.activation.get('p-1')?.active).toBe(true)
  })

  it('permite ao orientador principal desativar e reativar o projeto', async () => {
    const { repository, useCase } = setup()

    const off = await useCase.execute({ viewer: principalViewer, projectId: 'p-1', active: false })
    expect(off.isRight()).toBe(true)
    expect(repository.activation.get('p-1')).toEqual({ active: false, changedAt: now })

    const on = await useCase.execute({ viewer: principalViewer, projectId: 'p-1', active: true })
    expect(on.isRight()).toBe(true)
    expect(repository.activation.get('p-1')?.active).toBe(true)
  })

  it('nega orientador adicional, professor de fora e aluno', async () => {
    const { repository, useCase } = setup()
    const viewers = [
      satelliteViewer,
      { role: 'professor' as const, email: 'fora@cps.sp.gov.br' },
      { role: 'student' as const, email: 'prof@cps.sp.gov.br' },
    ]

    for (const viewer of viewers) {
      const result = await useCase.execute({ viewer, projectId: 'p-1', active: false })
      expect(result.isLeft()).toBe(true)
      if (result.isLeft()) expect(result.value.status).toBe(403)
    }
    expect(repository.activation.size).toBe(0)
  })

  it('devolve não encontrado para projeto que não está no banco', async () => {
    const { repository, useCase } = setup()
    const result = await useCase.execute({ viewer: adminViewer, projectId: 'demo', active: false })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.status).toBe(404)
    expect(repository.activation.size).toBe(0)
  })
})
