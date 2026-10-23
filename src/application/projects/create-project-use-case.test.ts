import { describe, expect, it } from 'vitest'
import { CreateProjectUseCase } from './create-project-use-case'
import { InMemoryProjectCommandRepository } from '@/test/repositories/in-memory-project-command-repository'
import { InMemoryProjectUserDirectory } from '@/test/repositories/in-memory-project-user-directory'

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
})
