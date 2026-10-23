import { describe, expect, it } from 'vitest'
import { parseUpdateProjectInput } from './update-project'

const fields = {
  title: 'Projeto Teste',
  summary: 'Resumo suficientemente longo do projeto.',
  overview: 'Descrição detalhada.',
  cycle: '2026/2',
  semester: 4,
  theme: 'Educação',
  status: 'publicado',
  studentEmails: ['A@aluno.cps.sp.gov.br'],
  languages: ['TypeScript'],
  stack: ['React'],
  liveUrl: 'https://projeto.vercel.app',
}

describe('parseUpdateProjectInput', () => {
  it('aceita a edição completa feita pelo orientador', () => {
    const result = parseUpdateProjectInput(fields, 'full')
    expect(result.isRight()).toBe(true)
    if (result.isRight() && result.value.scope === 'full') {
      expect(result.value.fields.status).toBe('publicado')
      expect(result.value.fields.studentEmails).toEqual(['a@aluno.cps.sp.gov.br'])
      expect(result.value.fields.liveUrl).toBe('https://projeto.vercel.app')
    }
  })

  it('não exige o orientador na edição', () => {
    expect(parseUpdateProjectInput(fields, 'full').isRight()).toBe(true)
  })

  it('exige ao menos um aluno na edição completa', () => {
    expect(parseUpdateProjectInput({ ...fields, studentEmails: [] }, 'full').isLeft()).toBe(true)
  })

  it('na edição de artefatos valida apenas os links e ignora os demais campos', () => {
    const result = parseUpdateProjectInput(
      { title: 'x', liveUrl: 'https://a.com', prototypeUrl: 'https://figma.com/x' },
      'artifacts',
    )
    expect(result.isRight()).toBe(true)
    if (result.isRight() && result.value.scope === 'artifacts') {
      expect(result.value.links.liveUrl).toBe('https://a.com')
      expect(result.value.links.repositoryUrl).toBeNull()
    }
  })

  it('ignora atribuições de equipe na edição de artefatos', () => {
    const result = parseUpdateProjectInput(
      {
        repositoryUrl: 'https://github.com/org/projeto',
        teamAssignments: [
          {
            studentEmail: 'a@aluno.cps.sp.gov.br',
            roleTitle: 'Desenvolvimento Front-end',
            isLeader: true,
          },
        ],
      },
      'artifacts',
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight() && result.value.scope === 'artifacts') {
      expect(result.value.links.repositoryUrl).toBe('https://github.com/org/projeto')
      expect('teamAssignments' in result.value).toBe(false)
    }
  })

  it('rejeita link inválido na edição de artefatos', () => {
    expect(parseUpdateProjectInput({ liveUrl: 'http://a.com' }, 'artifacts').isLeft()).toBe(true)
  })

  it('rejeita corpo vazio', () => {
    expect(parseUpdateProjectInput(null, 'full').isLeft()).toBe(true)
  })
})
