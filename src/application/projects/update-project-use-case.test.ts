import { describe, expect, it } from 'vitest'
import type { ProjectStatus } from '@/domain/enterprise/entities/project'
import { InMemoryProjectCommandRepository } from '@/test/repositories/in-memory-project-command-repository'
import { InMemoryProjectUserDirectory } from '@/test/repositories/in-memory-project-user-directory'
import { InMemoryProjectVerificationRepository } from '@/test/repositories/in-memory-project-verification-repository'
import { UpdateProjectUseCase } from './update-project-use-case'

const student = {
  email: 'aluno@fatec.sp.gov.br',
  name: 'Aluno Silva',
  githubUrl: null,
  linkedinUrl: null,
}
const advisorPerson = {
  email: 'professor@fatec.sp.gov.br',
  name: 'Professora Ana',
  githubUrl: null,
  linkedinUrl: null,
}
const satellitePerson = {
  email: 'satelite@fatec.sp.gov.br',
  name: 'Professor Satélite',
  githubUrl: null,
  linkedinUrl: null,
}
const thirdPerson = {
  email: 'terceiro@fatec.sp.gov.br',
  name: 'Professora Terceira',
  githubUrl: null,
  linkedinUrl: null,
}

const principal = { email: advisorPerson.email, name: advisorPerson.name }
const satellite = { email: satellitePerson.email, name: satellitePerson.name }

const professorViewer = { role: 'professor' as const, email: advisorPerson.email }
const adminViewer = { role: 'admin' as const, email: 'admin@fatec.sp.gov.br' }

const fullBody = {
  title: 'Projeto Integrador',
  summary: 'Resumo suficientemente detalhado do projeto.',
  overview: '',
  cycle: '2026/2',
  semester: 3,
  theme: 'Educação',
  status: 'em_andamento',
  studentEmails: [student.email],
}

function seed(status: ProjectStatus = 'em_andamento') {
  const repository = new InMemoryProjectCommandRepository()
  repository.projects.set('project-1', {
    id: 'project-1',
    title: 'Projeto Integrador',
    summary: 'Resumo suficientemente detalhado do projeto.',
    cycle: '2026/2',
    semester: 3,
    advisorEmail: principal.email,
    advisorName: principal.name,
    coAdvisors: [satellite],
    memberEmails: [student.email],
    teamMembers: [{ studentEmail: student.email, name: student.name }],
    languages: ['TypeScript'],
    stack: ['Next.js'],
    theme: 'Educação',
    status,
    verified: false,
    publicDetails: { overview: 'Descrição existente' },
    createdByUserId: 'prof-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  })
  const verifications = new InMemoryProjectVerificationRepository()
  const directory = new InMemoryProjectUserDirectory(
    [],
    [advisorPerson, satellitePerson, thirdPerson],
    [student],
  )
  return {
    repository,
    verifications,
    useCase: new UpdateProjectUseCase(repository, directory, verifications),
    existing: (overrides: object = {}) => ({
      id: 'project-1',
      status,
      advisor: principal,
      coAdvisors: [satellite],
      memberEmails: [student.email],
      publicDetails: { overview: 'Descrição existente' },
      ...overrides,
    }),
  }
}

function record(email: string, name: string, userId = email) {
  return {
    verifierUserId: userId,
    verifierEmail: email,
    verifierName: name,
    verifierRole: 'professor' as const,
    criteria: ['source_code' as const],
    verifiedAt: '2026-10-20T12:00:00.000Z',
  }
}

describe('UpdateProjectUseCase', () => {
  it('no escopo do administrador troca o orientador principal e preserva os demais detalhes', async () => {
    const { repository, useCase, existing } = seed()
    const result = await useCase.execute({
      project: existing(),
      viewer: adminViewer,
      scope: 'admin',
      body: {
        advisorEmail: thirdPerson.email,
        links: [
          { title: 'Repositório', url: 'https://github.com/org/p', icon: 'fi-rr-code-branch' },
        ],
      },
    })

    expect(result.isRight()).toBe(true)
    const stored = repository.projects.get('project-1')
    expect(stored?.advisorEmail).toBe(thirdPerson.email)
    expect(stored?.advisorName).toBe(thirdPerson.name)
    expect(stored?.coAdvisors).toEqual([satellite])
    expect(stored?.publicDetails).toMatchObject({
      overview: 'Descrição existente',
      externalLinks: [
        { label: 'Repositório', url: 'https://github.com/org/p', icon: 'fi-rr-code-branch' },
      ],
    })
    expect(stored?.teamMembers).toEqual([{ studentEmail: student.email, name: student.name }])
  })

  it('o administrador pode remover todos os orientadores adicionais', async () => {
    const { repository, useCase, existing } = seed()
    await useCase.execute({
      project: existing(),
      viewer: adminViewer,
      scope: 'admin',
      body: { coAdvisorEmails: [], links: [] },
    })

    expect(repository.projects.get('project-1')?.coAdvisors).toEqual([])
  })

  it('o orientador adiciona um co-orientador e mantém o principal', async () => {
    const { repository, useCase, existing } = seed()
    const result = await useCase.execute({
      project: existing(),
      viewer: professorViewer,
      scope: 'full',
      body: {
        ...fullBody,
        advisorEmail: thirdPerson.email,
        coAdvisorEmails: [satellite.email, thirdPerson.email],
      },
    })

    expect(result.isRight()).toBe(true)
    const stored = repository.projects.get('project-1')
    expect(stored?.advisorEmail).toBe(principal.email)
    expect(stored?.coAdvisors.map((advisor) => advisor.email)).toEqual([
      satellite.email,
      thirdPerson.email,
    ])
  })

  it('um co-orientador também edita o projeto por inteiro', async () => {
    const { repository, useCase, existing } = seed()
    const result = await useCase.execute({
      project: existing(),
      viewer: { role: 'professor', email: satellite.email },
      scope: 'full',
      body: { ...fullBody, title: 'Título pelo co-orientador' },
    })

    expect(result.isRight()).toBe(true)
    expect(repository.projects.get('project-1')?.title).toBe('Título pelo co-orientador')
    expect(repository.projects.get('project-1')?.coAdvisors).toEqual([satellite])
  })

  it('não deixa o professor se remover da lista de orientadores', async () => {
    const { repository, useCase, existing } = seed()
    const result = await useCase.execute({
      project: existing(),
      viewer: { role: 'professor', email: satellite.email },
      scope: 'full',
      body: { ...fullBody, coAdvisorEmails: [] },
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.status).toBe(400)
    expect(repository.projects.get('project-1')?.coAdvisors).toEqual([satellite])
  })

  it('rejeita orientador adicional que não é professor ativo', async () => {
    const { useCase, existing } = seed()
    const result = await useCase.execute({
      project: existing(),
      viewer: professorViewer,
      scope: 'full',
      body: { ...fullBody, coAdvisorEmails: [satellite.email, student.email] },
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.message).toContain(student.email)
  })

  it('não permite remover integrante que possui tarefa atribuída', async () => {
    const { repository, existing } = seed()
    repository.tasks.push({
      id: 'task-1',
      projectId: 'project-1',
      title: 'Tarefa existente',
      description: 'Descrição da tarefa',
      versionMajor: 1,
      versionMinor: 0,
      status: 'pending',
      targetStudentEmail: student.email,
      dueDate: null,
      createdByUserId: 'prof-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    const otherStudent = { ...student, email: 'outro@fatec.sp.gov.br', name: 'Outra Pessoa' }
    const directory = new InMemoryProjectUserDirectory(
      [],
      [advisorPerson, satellitePerson],
      [otherStudent],
    )
    const result = await new UpdateProjectUseCase(
      repository,
      directory,
      new InMemoryProjectVerificationRepository(),
    ).execute({
      project: existing(),
      viewer: professorViewer,
      scope: 'full',
      body: { ...fullBody, studentEmails: [otherStudent.email] },
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.status).toBe(409)
    expect(repository.projects.get('project-1')?.memberEmails).toEqual([student.email])
  })

  it('preserva as imagens existentes quando o corpo não envia a lista', async () => {
    const { repository, useCase, existing } = seed()
    const images = [
      { title: '', url: 'https://cdn.exemplo.com/a.png', orientation: 'vertical' as const },
    ]
    const project = existing({ publicDetails: { overview: 'x', images } })
    const stored = repository.projects.get('project-1')
    if (stored) {
      repository.projects.set('project-1', { ...stored, publicDetails: { overview: 'x', images } })
    }
    await useCase.execute({ project, viewer: professorViewer, scope: 'full', body: fullBody })

    expect(repository.projects.get('project-1')?.publicDetails?.images).toEqual(images)
  })

  describe('verificação', () => {
    it('adicionar um orientador a um projeto verificado volta o projeto para não verificado', async () => {
      const { repository, verifications, useCase, existing } = seed('publicado')
      await verifications.save('project-1', record(principal.email, principal.name), false)
      await verifications.save('project-1', record(satellite.email, satellite.name), true)

      const result = await useCase.execute({
        project: existing(),
        viewer: professorViewer,
        scope: 'full',
        body: {
          ...fullBody,
          status: 'publicado',
          coAdvisorEmails: [satellite.email, thirdPerson.email],
        },
      })

      expect(result.isRight()).toBe(true)
      expect(repository.projects.get('project-1')?.verified).toBe(false)
    })

    it('remover o orientador pendente completa a verificação e apaga a verificação de quem saiu', async () => {
      const { repository, verifications, useCase, existing } = seed('publicado')
      await verifications.save('project-1', record(principal.email, principal.name), false)

      const result = await useCase.execute({
        project: existing(),
        viewer: professorViewer,
        scope: 'full',
        body: { ...fullBody, status: 'publicado', coAdvisorEmails: [] },
      })

      expect(result.isRight()).toBe(true)
      expect(repository.projects.get('project-1')?.verified).toBe(true)
      expect(
        (await verifications.findByProject('project-1')).map((item) => item.verifierEmail),
      ).toEqual([principal.email])
    })

    it('voltar o projeto para em andamento limpa as verificações e remove o selo', async () => {
      const { repository, verifications, useCase, existing } = seed('publicado')
      await verifications.save('project-1', record(principal.email, principal.name), false)
      await verifications.save('project-1', record(satellite.email, satellite.name), true)

      await useCase.execute({
        project: existing(),
        viewer: professorViewer,
        scope: 'full',
        body: { ...fullBody, status: 'em_andamento' },
      })

      expect(repository.projects.get('project-1')?.verified).toBe(false)
      expect(await verifications.findByProject('project-1')).toEqual([])
    })
  })
})
