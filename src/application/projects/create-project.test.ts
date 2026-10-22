import { describe, expect, it } from 'vitest'
import { parseCreateProjectInput } from './create-project'

const valid = {
  title: 'Projeto Teste',
  summary: 'Resumo suficientemente longo do projeto.',
  overview: '',
  cycle: '2026/2',
  semester: 3,
  theme: 'Educação',
  advisorEmail: 'Prof@cps.sp.gov.br',
  studentEmails: ['a@aluno.cps.sp.gov.br', 'A@aluno.cps.sp.gov.br'],
  languages: ['TypeScript', 'typescript'],
  stack: ['React'],
  tasks: [],
}

describe('parseCreateProjectInput', () => {
  it('aceita um projeto sem tarefas e normaliza os dados', () => {
    const result = parseCreateProjectInput(valid)
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tasks).toEqual([])
      expect(result.value.advisorEmail).toBe('prof@cps.sp.gov.br')
      expect(result.value.studentEmails).toEqual(['a@aluno.cps.sp.gov.br'])
      expect(result.value.languages).toEqual(['TypeScript'])
      expect(result.value.status).toBe('em_andamento')
    }
  })

  it('aceita um projeto com tarefa inicial atribuída a um aluno do projeto', () => {
    const result = parseCreateProjectInput({
      ...valid,
      tasks: [
        {
          title: 'Levantar requisitos',
          description: 'Documentar os requisitos.',
          targetStudentEmail: 'a@aluno.cps.sp.gov.br',
          dueDate: '2026-11-30',
        },
      ],
    })
    expect(result.isRight()).toBe(true)
  })

  it('salva função opcional e líder para os integrantes selecionados', () => {
    const result = parseCreateProjectInput({
      ...valid,
      teamAssignments: [
        {
          studentEmail: 'a@aluno.cps.sp.gov.br',
          roleTitle: 'Desenvolvimento Front-end',
          isLeader: true,
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.teamAssignments).toEqual([
        {
          studentEmail: 'a@aluno.cps.sp.gov.br',
          roleTitle: 'Desenvolvimento Front-end',
          isLeader: true,
        },
      ])
    }
  })

  it('rejeita mais de um líder e uma função acima do limite', () => {
    expect(
      parseCreateProjectInput({
        ...valid,
        studentEmails: ['a@aluno.cps.sp.gov.br', 'b@aluno.cps.sp.gov.br'],
        teamAssignments: [
          { studentEmail: 'a@aluno.cps.sp.gov.br', isLeader: true },
          { studentEmail: 'b@aluno.cps.sp.gov.br', isLeader: true },
        ],
      }).isLeft(),
    ).toBe(true)

    expect(
      parseCreateProjectInput({
        ...valid,
        teamAssignments: [{ studentEmail: 'a@aluno.cps.sp.gov.br', roleTitle: 'F'.repeat(41) }],
      }).isLeft(),
    ).toBe(true)
  })

  it('rejeita responsável que não pertence ao projeto', () => {
    const result = parseCreateProjectInput({
      ...valid,
      tasks: [
        {
          title: 'Tarefa',
          description: 'Descrição válida',
          targetStudentEmail: 'outro@aluno.cps.sp.gov.br',
        },
      ],
    })
    expect(result.isLeft()).toBe(true)
  })

  it('exige ao menos um aluno e ciclo válido', () => {
    expect(parseCreateProjectInput({ ...valid, studentEmails: [] }).isLeft()).toBe(true)
    expect(parseCreateProjectInput({ ...valid, cycle: '2026' }).isLeft()).toBe(true)
  })

  it('aceita links de repositório, site no ar, protótipo e links adicionais', () => {
    const result = parseCreateProjectInput({
      ...valid,
      repositoryUrl: 'https://github.com/org/projeto',
      liveUrl: 'https://projeto.vercel.app',
      prototypeUrl: 'https://www.figma.com/file/abc',
      extraLinks: [
        { title: 'Vídeo de apresentação', url: 'https://youtu.be/abc' },
        { title: '', url: '' },
      ],
    })
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.liveUrl).toBe('https://projeto.vercel.app')
      expect(result.value.prototypeUrl).toBe('https://www.figma.com/file/abc')
      expect(result.value.extraLinks).toEqual([
        { title: 'Vídeo de apresentação', url: 'https://youtu.be/abc' },
      ])
    }
  })

  it('rejeita links que não sejam HTTPS', () => {
    expect(parseCreateProjectInput({ ...valid, liveUrl: 'http://site.com' }).isLeft()).toBe(true)
    expect(parseCreateProjectInput({ ...valid, prototypeUrl: 'figma' }).isLeft()).toBe(true)
    expect(
      parseCreateProjectInput({
        ...valid,
        extraLinks: [{ title: 'Doc', url: 'ftp://arquivo' }],
      }).isLeft(),
    ).toBe(true)
  })
})
