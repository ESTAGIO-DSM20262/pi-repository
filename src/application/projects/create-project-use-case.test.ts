import { describe, expect, it } from 'vitest'
import { InMemoryProjectCommandRepository } from '@/test/repositories/in-memory-project-command-repository'
import { InMemoryProjectUserDirectory } from '@/test/repositories/in-memory-project-user-directory'
import { CreateProjectUseCase } from './create-project-use-case'

const professor = {
  id: 'prof-1',
  email: 'professor@fatec.sp.gov.br',
  name: 'Professora Ana',
  role: 'professor' as const,
  githubUrl: null,
  linkedinUrl: null,
}
const student = {
  email: 'aluno@fatec.sp.gov.br',
  name: 'Aluno Silva',
  githubUrl: null,
  linkedinUrl: null,
}
const validBody = {
  title: 'Projeto Integrador',
  summary: 'Resumo suficientemente detalhado do projeto.',
  overview: '',
  cycle: '2026/2',
  semester: 3,
  theme: 'Educação',
  advisorEmail: professor.email,
  studentEmails: [student.email],
  languages: ['TypeScript'],
  stack: ['Next.js'],
  tasks: [],
}

describe('CreateProjectUseCase', () => {
  it('cria o projeto e aceita que as tarefas iniciais sejam opcionais', async () => {
    const repository = new InMemoryProjectCommandRepository()
    const users = new InMemoryProjectUserDirectory([professor], [professor], [student])
    const useCase = new CreateProjectUseCase(repository, users)

    const result = await useCase.execute({ sessionUserId: professor.id, body: validBody })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tasksCreated).toBe(0)
      expect(repository.projects.get(result.value.id)?.memberEmails).toEqual([student.email])
    }
  })

  it('impede cadastro por quem não é professor ou administrador', async () => {
    const user = { ...student, id: 'student-1', role: 'student' as const }
    const repository = new InMemoryProjectCommandRepository()
    const users = new InMemoryProjectUserDirectory([user], [professor], [student])
    const result = await new CreateProjectUseCase(repository, users).execute({
      sessionUserId: user.id,
      body: validBody,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.status).toBe(403)
    expect(repository.projects.size).toBe(0)
  })

  it('rejeita alunos que não estão ativos no diretório', async () => {
    const repository = new InMemoryProjectCommandRepository()
    const users = new InMemoryProjectUserDirectory([professor], [professor], [])
    const result = await new CreateProjectUseCase(repository, users).execute({
      sessionUserId: professor.id,
      body: validBody,
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.status).toBe(400)
    expect(repository.projects.size).toBe(0)
  })

  describe('professores orientadores', () => {
    const satellite = {
      email: 'satelite@fatec.sp.gov.br',
      name: 'Professor Satélite',
      githubUrl: null,
      linkedinUrl: null,
    }
    const admin = {
      id: 'adm-1',
      email: 'admin@fatec.sp.gov.br',
      name: 'Administração',
      role: 'admin' as const,
    }

    it('grava os orientadores adicionais escolhidos pelo professor, que continua sendo o principal', async () => {
      const repository = new InMemoryProjectCommandRepository()
      const users = new InMemoryProjectUserDirectory([professor], [professor, satellite], [student])
      const result = await new CreateProjectUseCase(repository, users).execute({
        sessionUserId: professor.id,
        body: { ...validBody, advisorEmail: professor.email, coAdvisorEmails: [satellite.email] },
      })

      expect(result.isRight()).toBe(true)
      if (result.isRight()) {
        const stored = repository.projects.get(result.value.id)
        expect(stored?.advisorEmail).toBe(professor.email)
        expect(stored?.coAdvisors).toEqual([{ email: satellite.email, name: satellite.name }])
      }
    })

    it('permite que o administrador escolha o principal e os adicionais', async () => {
      const repository = new InMemoryProjectCommandRepository()
      const users = new InMemoryProjectUserDirectory([admin], [professor, satellite], [student])
      const result = await new CreateProjectUseCase(repository, users).execute({
        sessionUserId: admin.id,
        body: { ...validBody, advisorEmail: satellite.email, coAdvisorEmails: [professor.email] },
      })

      expect(result.isRight()).toBe(true)
      if (result.isRight()) {
        const stored = repository.projects.get(result.value.id)
        expect(stored?.advisorEmail).toBe(satellite.email)
        expect(stored?.coAdvisors.map((advisor) => advisor.email)).toEqual([professor.email])
      }
    })

    it('rejeita orientador adicional inexistente ou inativo e não grava nada', async () => {
      const repository = new InMemoryProjectCommandRepository()
      const users = new InMemoryProjectUserDirectory([professor], [professor], [student])
      const result = await new CreateProjectUseCase(repository, users).execute({
        sessionUserId: professor.id,
        body: { ...validBody, coAdvisorEmails: [satellite.email] },
      })

      expect(result.isLeft()).toBe(true)
      if (result.isLeft()) expect(result.value.status).toBe(400)
      expect(repository.projects.size).toBe(0)
    })
  })

  it('padroniza as tecnologias e grava links e imagens com orientação', async () => {
    const repository = new InMemoryProjectCommandRepository()
    const users = new InMemoryProjectUserDirectory([professor], [professor], [student])
    const result = await new CreateProjectUseCase(repository, users).execute({
      sessionUserId: professor.id,
      body: {
        ...validBody,
        languages: ['ts'],
        stack: ['nextjs'],
        links: [{ title: 'Site no ar', url: 'https://site.com', icon: 'fi-rr-globe' }],
        images: [
          { title: 'Home', url: 'https://cdn.exemplo.com/h.png', orientation: 'horizontal' },
        ],
      },
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const stored = repository.projects.get(result.value.id)
      expect(stored?.languages).toEqual(['TypeScript'])
      expect(stored?.stack).toEqual(['Next.js'])
      expect(stored?.publicDetails.externalLinks).toEqual([
        { label: 'Site no ar', url: 'https://site.com', icon: 'fi-rr-globe' },
      ])
      expect(stored?.publicDetails.images).toEqual([
        { title: 'Home', url: 'https://cdn.exemplo.com/h.png', orientation: 'horizontal' },
      ])
    }
  })
})
