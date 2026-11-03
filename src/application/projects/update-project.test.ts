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
  links: [{ title: 'Site no ar', url: 'https://projeto.vercel.app', icon: 'fi-rr-globe' }],
}

describe('parseUpdateProjectInput', () => {
  it('aceita a edição completa feita por um orientador', () => {
    const result = parseUpdateProjectInput(fields, 'full')
    expect(result.isRight()).toBe(true)
    if (result.isRight() && result.value.scope === 'full') {
      expect(result.value.fields.status).toBe('publicado')
      expect(result.value.fields.studentEmails).toEqual(['a@aluno.cps.sp.gov.br'])
      expect(result.value.fields.links).toEqual(fields.links)
    }
  })

  it('não exige o orientador principal na edição completa', () => {
    const result = parseUpdateProjectInput(fields, 'full')
    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect(result.value.advisors.advisorEmail).toBeNull()
  })

  it('diferencia lista de co-orientadores ausente (manter) de lista vazia (remover todos)', () => {
    const kept = parseUpdateProjectInput(fields, 'full')
    const cleared = parseUpdateProjectInput({ ...fields, coAdvisorEmails: [] }, 'full')

    expect(kept.isRight() && kept.value.advisors.coAdvisorEmails).toBeUndefined()
    expect(cleared.isRight() && cleared.value.advisors.coAdvisorEmails).toEqual([])
  })

  it('exige ao menos um aluno na edição completa', () => {
    expect(parseUpdateProjectInput({ ...fields, studentEmails: [] }, 'full').isLeft()).toBe(true)
  })

  it('na edição do administrador valida orientadores, links e imagens e ignora o resto', () => {
    const result = parseUpdateProjectInput(
      {
        title: 'x',
        status: 'publicado',
        advisorEmail: 'Novo@cps.sp.gov.br',
        coAdvisorEmails: ['satelite@cps.sp.gov.br'],
        links: [
          { title: 'Repositório', url: 'https://github.com/org/p', icon: 'fi-rr-code-branch' },
        ],
        images: [{ title: '', url: 'https://cdn.exemplo.com/a.png', orientation: 'vertical' }],
      },
      'admin',
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight() && result.value.scope === 'admin') {
      expect(result.value.advisors).toEqual({
        advisorEmail: 'novo@cps.sp.gov.br',
        coAdvisorEmails: ['satelite@cps.sp.gov.br'],
      })
      expect(result.value.links).toHaveLength(1)
      expect(result.value.images).toHaveLength(1)
      expect('fields' in result.value).toBe(false)
    }
  })

  it('ignora atribuições de equipe na edição do administrador', () => {
    const result = parseUpdateProjectInput(
      {
        links: [],
        teamAssignments: [{ studentEmail: 'a@aluno.cps.sp.gov.br', isLeader: true }],
      },
      'admin',
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect('teamAssignments' in result.value).toBe(false)
  })

  it('rejeita link inválido na edição do administrador', () => {
    const result = parseUpdateProjectInput(
      { links: [{ title: 'Site', url: 'http://a.com', icon: 'fi-rr-globe' }] },
      'admin',
    )
    expect(result.isLeft()).toBe(true)
  })

  it('rejeita corpo vazio', () => {
    expect(parseUpdateProjectInput(null, 'full').isLeft()).toBe(true)
  })
})

describe('advisorEmail no escopo completo', () => {
  it('ignora o orientador principal enviado no corpo e não o usa para filtrar os co-orientadores', () => {
    const result = parseUpdateProjectInput(
      {
        ...fields,
        advisorEmail: 'terceiro@cps.sp.gov.br',
        coAdvisorEmails: ['terceiro@cps.sp.gov.br'],
      },
      'full',
    )
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.advisors).toEqual({
        advisorEmail: null,
        coAdvisorEmails: ['terceiro@cps.sp.gov.br'],
      })
    }
  })
})
