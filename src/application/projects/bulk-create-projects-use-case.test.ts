import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/enterprise/entities/project'
import { InMemoryProjectCommandRepository } from '@/test/repositories/in-memory-project-command-repository'
import { InMemoryProjectReader } from '@/test/repositories/in-memory-project-reader'
import { InMemoryProjectUserDirectory } from '@/test/repositories/in-memory-project-user-directory'
import {
  BulkCreateProjectsUseCase,
  DUPLICATE_EXISTING_REASON,
  DUPLICATE_IN_SHEET_REASON,
  projectDuplicateKey,
} from './bulk-create-projects-use-case'
import type { ImportedProjectRow } from './project-import'

const professor = {
  id: 'prof-1',
  email: 'professor@fatec.sp.gov.br',
  name: 'Professora Ana',
  role: 'professor' as const,
  githubUrl: null,
  linkedinUrl: null,
}
const satellite = {
  id: 'prof-2',
  email: 'satelite@fatec.sp.gov.br',
  name: 'Professor Satélite',
  role: 'professor' as const,
  githubUrl: null,
  linkedinUrl: null,
}
const admin = {
  id: 'adm-1',
  email: 'admin@fatec.sp.gov.br',
  name: 'Administração',
  role: 'admin' as const,
}
const student = {
  email: 'aluno@fatec.sp.gov.br',
  name: 'Aluno Silva',
  githubUrl: null,
  linkedinUrl: null,
}
const otherStudent = {
  email: 'outro@fatec.sp.gov.br',
  name: 'Outro Aluno',
  githubUrl: null,
  linkedinUrl: null,
}

function makeRow(overrides: Partial<ImportedProjectRow> = {}): ImportedProjectRow {
  return {
    sheet: 'Projetos',
    rowNumber: 2,
    title: 'Projeto Integrador',
    summary: 'Resumo suficientemente detalhado do projeto.',
    overview: '',
    cycle: '2026/2',
    semester: 3,
    course: '',
    theme: 'Educação',
    status: 'em_andamento',
    advisorEmail: '',
    coAdvisorEmails: [],
    studentEmails: [student.email],
    leaderEmail: '',
    languages: ['TypeScript'],
    stack: ['Next.js'],
    links: [],
    ...overrides,
  }
}

function setup(account: typeof professor | typeof admin, existing: Project[] = []) {
  const repository = new InMemoryProjectCommandRepository()
  const users = new InMemoryProjectUserDirectory(
    [account],
    [professor, satellite],
    [student, otherStudent],
  )
  const useCase = new BulkCreateProjectsUseCase(
    repository,
    users,
    new InMemoryProjectReader(existing),
  )
  return { repository, useCase }
}

function existingProject(title: string, cycle = '2026/2', semester = 3): Project {
  return {
    id: 'existing-1',
    title,
    summary: 'Resumo existente',
    cycle,
    semester,
    advisor: { email: professor.email, name: professor.name },
    memberEmails: [],
    languages: [],
    stack: [],
    theme: 'Educação',
    status: 'em_andamento',
    verified: false,
    cover: { icon: 'fi-rr-folder-open', label: 'Educação', tone: 'slate' },
  }
}

describe('BulkCreateProjectsUseCase', () => {
  it('cadastra os projetos da planilha com o professor como orientador principal', async () => {
    const { repository, useCase } = setup(professor)

    const result = await useCase.execute({
      sessionUserId: professor.id,
      rows: [makeRow(), makeRow({ rowNumber: 3, title: 'Segundo Projeto' })],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.created).toHaveLength(2)
      expect(result.value.errors).toHaveLength(0)
      expect(result.value.skipped).toHaveLength(0)
    }
    expect(repository.projects.size).toBe(2)
    for (const project of repository.projects.values()) {
      expect(project.advisorEmail).toBe(professor.email)
      expect(project.createdByUserId).toBe(professor.id)
    }
  })

  it('recusa quem não é professor nem administrador', async () => {
    const studentAccount = { ...student, id: 'student-1', role: 'student' as const }
    const repository = new InMemoryProjectCommandRepository()
    const users = new InMemoryProjectUserDirectory([studentAccount], [professor], [student])
    const useCase = new BulkCreateProjectsUseCase(repository, users, new InMemoryProjectReader())
    const result = await useCase.execute({ sessionUserId: studentAccount.id, rows: [makeRow()] })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.status).toBe(403)
    expect(repository.projects.size).toBe(0)
  })

  it('ignora projeto que já existe com o mesmo título, ciclo e semestre', async () => {
    const { repository, useCase } = setup(professor, [existingProject('projeto  INTEGRADOR')])

    const result = await useCase.execute({ sessionUserId: professor.id, rows: [makeRow()] })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.created).toHaveLength(0)
      expect(result.value.skipped).toEqual([
        {
          sheet: 'Projetos',
          rowNumber: 2,
          title: 'Projeto Integrador',
          reason: DUPLICATE_EXISTING_REASON,
        },
      ])
    }
    expect(repository.projects.size).toBe(0)
  })

  it('cadastra o mesmo título em outro semestre ou ciclo', async () => {
    const { repository, useCase } = setup(professor, [existingProject('Projeto Integrador')])

    const result = await useCase.execute({
      sessionUserId: professor.id,
      rows: [makeRow({ semester: 4 }), makeRow({ rowNumber: 3, cycle: '2027/1' })],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect(result.value.created).toHaveLength(2)
    expect(repository.projects.size).toBe(2)
  })

  it('ignora a linha repetida dentro da própria planilha', async () => {
    const { repository, useCase } = setup(professor)

    const result = await useCase.execute({
      sessionUserId: professor.id,
      rows: [makeRow(), makeRow({ rowNumber: 3 })],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.created).toHaveLength(1)
      expect(result.value.skipped.map((item) => item.reason)).toEqual([DUPLICATE_IN_SHEET_REASON])
    }
    expect(repository.projects.size).toBe(1)
  })

  it('exige o orientador principal quando quem importa é administrador', async () => {
    const { repository, useCase } = setup(admin)

    const result = await useCase.execute({
      sessionUserId: admin.id,
      rows: [makeRow(), makeRow({ rowNumber: 3, title: 'Outro', advisorEmail: satellite.email })],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.errors.map((item) => item.reason)).toEqual([
        'Informe o e-mail do orientador principal.',
      ])
      expect(result.value.created).toHaveLength(1)
    }
    expect([...repository.projects.values()][0]?.advisorEmail).toBe(satellite.email)
  })

  it('impede que o professor cadastre projeto de outro orientador principal', async () => {
    const { repository, useCase } = setup(professor)

    const result = await useCase.execute({
      sessionUserId: professor.id,
      rows: [makeRow({ advisorEmail: satellite.email })],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect(result.value.errors).toHaveLength(1)
    expect(repository.projects.size).toBe(0)
  })

  it('aponta os alunos e orientadores que não existem ou estão inativos', async () => {
    const { repository, useCase } = setup(professor)

    const result = await useCase.execute({
      sessionUserId: professor.id,
      rows: [
        makeRow({ studentEmails: [student.email, 'fantasma@fatec.sp.gov.br'] }),
        makeRow({ rowNumber: 3, title: 'Outro', coAdvisorEmails: ['ausente@fatec.sp.gov.br'] }),
      ],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.errors.map((item) => item.reason)).toEqual([
        'Alunos não encontrados ou inativos: fantasma@fatec.sp.gov.br.',
        'Orientadores adicionais não encontrados ou inativos: ausente@fatec.sp.gov.br.',
      ])
    }
    expect(repository.projects.size).toBe(0)
  })

  it('define o líder do grupo e exige que ele esteja entre os alunos', async () => {
    const { repository, useCase } = setup(professor)

    const result = await useCase.execute({
      sessionUserId: professor.id,
      rows: [
        makeRow({
          studentEmails: [student.email, otherStudent.email],
          leaderEmail: otherStudent.email,
        }),
        makeRow({ rowNumber: 3, title: 'Outro', leaderEmail: otherStudent.email }),
      ],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.created).toHaveLength(1)
      expect(result.value.errors).toHaveLength(1)
    }
    const [stored] = [...repository.projects.values()]
    expect(stored?.teamMembers.find((member) => member.isLeader)?.studentEmail).toBe(
      otherStudent.email,
    )
  })

  it('devolve a mensagem de validação do projeto sem interromper as demais linhas', async () => {
    const { repository, useCase } = setup(professor)

    const result = await useCase.execute({
      sessionUserId: professor.id,
      rows: [makeRow({ summary: 'curto' }), makeRow({ rowNumber: 3, title: 'Outro' })],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.errors[0]?.reason).toBe('O resumo deve ter entre 10 e 600 caracteres.')
      expect(result.value.created).toHaveLength(1)
    }
    expect(repository.projects.size).toBe(1)
  })
})

describe('projectDuplicateKey', () => {
  it('ignora acentos, caixa e espaços repetidos', () => {
    expect(projectDuplicateKey('  Gestão   de Projetos ', '2026/2', 3)).toBe(
      projectDuplicateKey('gestao de projetos', '2026/2', 3),
    )
  })

  it('diferencia ciclo e semestre', () => {
    expect(projectDuplicateKey('PI', '2026/2', 3)).not.toBe(projectDuplicateKey('PI', '2026/1', 3))
    expect(projectDuplicateKey('PI', '2026/2', 3)).not.toBe(projectDuplicateKey('PI', '2026/2', 4))
  })
})
