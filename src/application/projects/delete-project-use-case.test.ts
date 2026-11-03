import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/enterprise/entities/project'
import { InMemoryProjectCommandRepository } from '@/test/repositories/in-memory-project-command-repository'
import { InMemoryProjectReader } from '@/test/repositories/in-memory-project-reader'
import { DeleteProjectUseCase } from './delete-project-use-case'

function makeProject(active: boolean | undefined): Project {
  return {
    id: 'p-1',
    title: 'Projeto',
    summary: 'Resumo',
    cycle: '2026/2',
    semester: 3,
    advisor: { email: 'prof@cps.sp.gov.br', name: 'Prof.' },
    memberEmails: [],
    languages: [],
    stack: [],
    theme: 'Tema',
    status: 'publicado',
    verified: false,
    active,
    cover: { icon: 'fi-rr-folder-open', label: 'Tema', tone: 'slate' },
  }
}

describe('DeleteProjectUseCase', () => {
  it('exclui um projeto desativado quando o administrador pede', async () => {
    const repository = new InMemoryProjectCommandRepository()
    const useCase = new DeleteProjectUseCase(
      new InMemoryProjectReader([makeProject(false)]),
      repository,
    )

    const result = await useCase.execute({ viewer: { role: 'admin' }, projectId: 'p-1' })

    expect(result.isRight()).toBe(true)
    expect(repository.deletedIds).toEqual(['p-1'])
  })

  it('não exclui projeto ativo e orienta a desativar antes', async () => {
    const repository = new InMemoryProjectCommandRepository()
    const useCase = new DeleteProjectUseCase(
      new InMemoryProjectReader([makeProject(true)]),
      repository,
    )

    const result = await useCase.execute({ viewer: { role: 'admin' }, projectId: 'p-1' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value.status).toBe(409)
      expect(result.value.message).toContain('Desative')
    }
    expect(repository.deletedIds).toEqual([])
  })

  it('trata projeto sem a marcação de ativo como ativo e não o exclui', async () => {
    const repository = new InMemoryProjectCommandRepository()
    const useCase = new DeleteProjectUseCase(
      new InMemoryProjectReader([makeProject(undefined)]),
      repository,
    )

    const result = await useCase.execute({ viewer: { role: 'admin' }, projectId: 'p-1' })
    expect(result.isLeft()).toBe(true)
  })

  it('nega a exclusão para quem não é administrador, mesmo com o projeto desativado', async () => {
    const repository = new InMemoryProjectCommandRepository()
    const useCase = new DeleteProjectUseCase(
      new InMemoryProjectReader([makeProject(false)]),
      repository,
    )

    for (const role of ['professor', 'student'] as const) {
      const result = await useCase.execute({ viewer: { role }, projectId: 'p-1' })
      expect(result.isLeft()).toBe(true)
      if (result.isLeft()) expect(result.value.status).toBe(403)
    }
    expect(repository.deletedIds).toEqual([])
  })

  it('devolve não encontrado para projeto inexistente', async () => {
    const useCase = new DeleteProjectUseCase(
      new InMemoryProjectReader([]),
      new InMemoryProjectCommandRepository(),
    )
    const result = await useCase.execute({ viewer: { role: 'admin' }, projectId: 'nada' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.status).toBe(404)
  })
})
