import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/enterprise/entities/project'
import { InMemoryProjectReader } from '@/test/repositories/in-memory-project-reader'
import { InMemoryProjectVerificationRepository } from '@/test/repositories/in-memory-project-verification-repository'
import type { ProjectViewer } from './project-permissions'
import { RemoveProjectVerificationUseCase } from './remove-project-verification-use-case'
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

async function setup(project: Project = makeProject()) {
  const reader = new InMemoryProjectReader([project])
  const verifications = new InMemoryProjectVerificationRepository()
  const verify = new VerifyProjectUseCase(reader, verifications)
  const remove = new RemoveProjectVerificationUseCase(reader, verifications)
  await verify.execute({ viewer: ana, projectId: 'p-1', body: { criteria: ['source_code'] } })
  await verify.execute({ viewer: caio, projectId: 'p-1', body: { criteria: ['documentation'] } })
  return { verifications, remove }
}

describe('RemoveProjectVerificationUseCase', () => {
  it('remove a indicação do orientador e tira o projeto de indicado', async () => {
    const { verifications, remove } = await setup()
    expect(verifications.verifiedFlags.get('p-1')).toBe(true)

    const result = await remove.execute({ viewer: ana, projectId: 'p-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.summary.complete).toBe(false)
      expect(result.value.summary.verifiedCount).toBe(1)
    }
    expect(verifications.verifiedFlags.get('p-1')).toBe(false)
    const stored = await verifications.findByProject('p-1')
    expect(stored.map((item) => item.verifierUserId)).toEqual([caio.id])
  })

  it('só remove a própria indicação, sem mexer na do outro orientador', async () => {
    const { verifications, remove } = await setup()

    await remove.execute({ viewer: caio, projectId: 'p-1' })

    const stored = await verifications.findByProject('p-1')
    expect(stored.map((item) => item.verifierUserId)).toEqual([ana.id])
  })

  it('devolve 404 quando o professor ainda não indicou', async () => {
    const { remove } = await setup()
    await remove.execute({ viewer: ana, projectId: 'p-1' })

    const again = await remove.execute({ viewer: ana, projectId: 'p-1' })

    expect(again.isLeft()).toBe(true)
    if (again.isLeft()) expect(again.value.status).toBe(404)
  })

  it('nega professor de fora e aluno', async () => {
    const { verifications, remove } = await setup()

    for (const viewer of [outsider, student]) {
      const result = await remove.execute({ viewer, projectId: 'p-1' })
      expect(result.isLeft()).toBe(true)
      if (result.isLeft()) expect(result.value.status).toBe(403)
    }
    expect(await verifications.findByProject('p-1')).toHaveLength(2)
  })

  it('devolve 404 para projeto inexistente', async () => {
    const { remove } = await setup()

    const result = await remove.execute({ viewer: ana, projectId: 'nao-existe' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.status).toBe(404)
  })
})
