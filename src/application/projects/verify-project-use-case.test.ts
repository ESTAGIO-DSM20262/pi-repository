import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/enterprise/entities/project'
import { InMemoryProjectReader } from '@/test/repositories/in-memory-project-reader'
import { InMemoryProjectVerificationRepository } from '@/test/repositories/in-memory-project-verification-repository'
import { GetProjectVerificationUseCase } from './get-project-verification-use-case'
import type { ProjectViewer } from './project-permissions'
import { VerifyProjectUseCase } from './verify-project-use-case'

const ana: ProjectViewer = {
  id: 'u-ana',
  email: 'ana@cps.sp.gov.br',
  name: 'Profa. Ana',
  role: 'professor',
}
const caio: ProjectViewer = {
  id: 'u-caio',
  email: 'caio@cps.sp.gov.br',
  name: 'Prof. Caio',
  role: 'professor',
}
const outsider: ProjectViewer = {
  id: 'u-x',
  email: 'x@cps.sp.gov.br',
  name: 'Prof. X',
  role: 'professor',
}
const admin: ProjectViewer = {
  id: 'u-adm',
  email: 'adm@cps.sp.gov.br',
  name: 'Administração',
  role: 'admin',
}
const student: ProjectViewer = {
  id: 'u-s',
  email: 'aluno@aluno.cps.sp.gov.br',
  name: 'Aluno',
  role: 'student',
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p-1',
    title: 'Projeto',
    summary: 'Resumo',
    cycle: '2026/2',
    semester: 3,
    advisor: { email: ana.email, name: ana.name },
    coAdvisors: [{ email: caio.email, name: caio.name }],
    memberEmails: [student.email],
    languages: [],
    stack: [],
    theme: 'Tema',
    status: 'publicado',
    verified: false,
    cover: { icon: 'fi-rr-folder-open', label: 'Tema', tone: 'slate' },
    ...overrides,
  }
}

const now = new Date('2026-10-27T15:00:00Z')

function setup(project: Project = makeProject()) {
  const verifications = new InMemoryProjectVerificationRepository()
  const useCase = new VerifyProjectUseCase(
    new InMemoryProjectReader([project]),
    verifications,
    () => now,
  )
  return { verifications, useCase }
}

describe('VerifyProjectUseCase', () => {
  it('com dois orientadores, o selo só aparece depois que o segundo verifica', async () => {
    const { verifications, useCase } = setup()

    const first = await useCase.execute({
      viewer: ana,
      projectId: 'p-1',
      body: { criteria: ['source_code', 'documentation'] },
    })
    expect(first.isRight()).toBe(true)
    if (first.isRight()) {
      expect(first.value.summary.complete).toBe(false)
      expect(first.value.summary.verifiedCount).toBe(1)
    }
    expect(verifications.verifiedFlags.get('p-1')).toBe(false)

    const second = await useCase.execute({
      viewer: caio,
      projectId: 'p-1',
      body: { criteria: ['source_code', 'final_result'] },
    })
    expect(second.isRight()).toBe(true)
    if (second.isRight()) {
      expect(second.value.summary.complete).toBe(true)
      expect(second.value.summary.criteria.map((item) => item.id)).toEqual([
        'source_code',
        'documentation',
        'final_result',
      ])
    }
    expect(verifications.verifiedFlags.get('p-1')).toBe(true)
  })

  it('permite ao orientador atualizar a própria verificação sem duplicar o registro', async () => {
    const { verifications, useCase } = setup(makeProject({ coAdvisors: [] }))

    await useCase.execute({ viewer: ana, projectId: 'p-1', body: { criteria: ['source_code'] } })
    await useCase.execute({ viewer: ana, projectId: 'p-1', body: { criteria: ['documentation'] } })

    const stored = await verifications.findByProject('p-1')
    expect(stored).toHaveLength(1)
    expect(stored[0].criteria).toEqual(['documentation'])
    expect(stored[0].verifiedAt).toBe(now.toISOString())
  })

  it('exige ao menos um critério válido', async () => {
    const { verifications, useCase } = setup()

    for (const body of [{ criteria: [] }, { criteria: ['inventado'] }, {}, null]) {
      const result = await useCase.execute({ viewer: ana, projectId: 'p-1', body })
      expect(result.isLeft()).toBe(true)
      if (result.isLeft()) expect(result.value.status).toBe(400)
    }
    expect(await verifications.findByProject('p-1')).toEqual([])
  })

  it('só aceita verificação de projeto concluído', async () => {
    const { useCase } = setup(makeProject({ status: 'em_andamento' }))
    const result = await useCase.execute({
      viewer: ana,
      projectId: 'p-1',
      body: { criteria: ['source_code'] },
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.status).toBe(409)
  })

  it('nega professor de fora, aluno e visitante sem registrar nada', async () => {
    const { verifications, useCase } = setup()

    for (const viewer of [outsider, student]) {
      const result = await useCase.execute({
        viewer,
        projectId: 'p-1',
        body: { criteria: ['source_code'] },
      })
      expect(result.isLeft()).toBe(true)
      if (result.isLeft()) expect(result.value.status).toBe(403)
    }
    expect(await verifications.findByProject('p-1')).toEqual([])
  })

  it('o administrador pode verificar, mas isso não conta como orientador', async () => {
    const { verifications, useCase } = setup()
    const result = await useCase.execute({
      viewer: admin,
      projectId: 'p-1',
      body: { criteria: ['final_result'] },
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.summary.complete).toBe(false)
      expect(result.value.summary.administrators).toHaveLength(1)
    }
    expect(verifications.verifiedFlags.get('p-1')).toBe(false)
  })

  it('projeto desativado fica inacessível para professor, mas o administrador ainda enxerga', async () => {
    const { useCase } = setup(makeProject({ active: false }))
    const asProfessor = await useCase.execute({
      viewer: ana,
      projectId: 'p-1',
      body: { criteria: ['source_code'] },
    })
    expect(asProfessor.isLeft()).toBe(true)
    if (asProfessor.isLeft()) expect(asProfessor.value.status).toBe(404)
  })

  it('devolve não encontrado para projeto inexistente ou demonstrativo', async () => {
    const { useCase } = setup()
    const result = await useCase.execute({
      viewer: ana,
      projectId: 'demo',
      body: { criteria: ['source_code'] },
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.status).toBe(404)
  })
})

describe('GetProjectVerificationUseCase', () => {
  it('monta o resumo a partir dos orientadores atuais e das verificações salvas', async () => {
    const verifications = new InMemoryProjectVerificationRepository()
    await verifications.save(
      'p-1',
      {
        verifierUserId: ana.id,
        verifierEmail: ana.email,
        verifierName: ana.name,
        verifierRole: 'professor',
        criteria: ['source_code'],
        verifiedAt: now.toISOString(),
      },
      false,
    )

    const summary = await new GetProjectVerificationUseCase(verifications).execute({
      project: makeProject(),
    })

    expect(summary.requiredCount).toBe(2)
    expect(summary.verifiedCount).toBe(1)
    expect(summary.advisors.find((item) => item.email === caio.email)?.verified).toBe(false)
  })
})
