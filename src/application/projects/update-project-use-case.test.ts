import { describe, expect, it } from 'vitest'
import { InMemoryProjectCommandRepository } from '@/test/repositories/in-memory-project-command-repository'
import { InMemoryProjectUserDirectory } from '@/test/repositories/in-memory-project-user-directory'
import { UpdateProjectUseCase } from './update-project-use-case'

const student = {
  email: 'aluno@fatec.sp.gov.br',
  name: 'Aluno Silva',
  githubUrl: null,
  linkedinUrl: null,
}

function seedRepository() {
  const repository = new InMemoryProjectCommandRepository()
  repository.projects.set('project-1', {
    id: 'project-1',
    title: 'Projeto Integrador',
    summary: 'Resumo suficientemente detalhado do projeto.',
    cycle: '2026/2',
    semester: 3,
    advisorEmail: 'professor@fatec.sp.gov.br',
    advisorName: 'Professora Ana',
    memberEmails: [student.email],
    teamMembers: [{ studentEmail: student.email, name: student.name }],
    languages: ['TypeScript'],
    stack: ['Next.js'],
    theme: 'Educação',
    status: 'em_andamento',
    verified: false,
    publicDetails: { overview: 'Descrição existente', attachments: [] },
    createdByUserId: 'prof-1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  })
  return repository
}

describe('UpdateProjectUseCase', () => {
  it('preserva detalhes não editáveis ao atualizar links de artefatos', async () => {
    const repository = seedRepository()
    const users = new InMemoryProjectUserDirectory([], [], [])
    const useCase = new UpdateProjectUseCase(repository, users)
    const result = await useCase.execute({
      project: {
        id: 'project-1',
        memberEmails: [student.email],
        publicDetails: { overview: 'Descrição existente', attachments: [] },
      },
      scope: 'artifacts',
      body: {
        repositoryUrl: 'https://github.com/org/projeto',
        teamAssignments: [{ studentEmail: student.email, roleTitle: 'Hack' }],
      },
    })

    expect(result.isRight()).toBe(true)
    expect(repository.projects.get('project-1')?.publicDetails).toMatchObject({
      overview: 'Descrição existente',
      attachments: [],
      externalLinks: [{ label: 'Repositório', url: 'https://github.com/org/projeto' }],
    })
    expect(repository.projects.get('project-1')?.teamMembers).toEqual([
      { studentEmail: student.email, name: student.name },
    ])
    expect(repository.projects.get('project-1')?.memberEmails).toEqual([student.email])
  })

  it('não permite remover integrante que possui tarefa atribuída', async () => {
    const repository = seedRepository()
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
    const users = new InMemoryProjectUserDirectory([], [], [otherStudent])
    const result = await new UpdateProjectUseCase(repository, users).execute({
      project: {
        id: 'project-1',
        memberEmails: [student.email],
        publicDetails: { overview: 'Descrição existente' },
      },
      scope: 'full',
      body: {
        title: 'Projeto Integrador',
        summary: 'Resumo suficientemente detalhado do projeto.',
        overview: '',
        cycle: '2026/2',
        semester: 3,
        theme: 'Educação',
        status: 'em_andamento',
        advisorEmail: 'professor@fatec.sp.gov.br',
        studentEmails: [otherStudent.email],
      },
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.status).toBe(409)
    expect(repository.projects.get('project-1')?.memberEmails).toEqual([student.email])
  })
})
