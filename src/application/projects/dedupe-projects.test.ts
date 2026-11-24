import { describe, expect, it } from 'vitest'
import { dedupeProjects, omitExamplesAlreadyStored } from './dedupe-projects'

function make(id: string, title: string, cycle = '2026/2', semester = 3) {
  return { id, title, cycle, semester }
}

describe('dedupeProjects', () => {
  it('mantém só a primeira ocorrência do mesmo id', () => {
    const result = dedupeProjects([make('a', 'SALA'), make('a', 'Outro título')])
    expect(result.map((project) => project.id)).toEqual(['a'])
  })

  it('trata título, ciclo e semestre iguais como o mesmo projeto, ignorando caixa e acento', () => {
    const result = dedupeProjects([
      make('real', 'SALA — Agendamento'),
      make('1', 'sala — agendamento'),
    ])
    expect(result.map((project) => project.id)).toEqual(['real'])
  })

  it('não junta projetos de ciclos ou semestres diferentes', () => {
    const result = dedupeProjects([
      make('a', 'SALA', '2026/1'),
      make('b', 'SALA', '2026/2'),
      make('c', 'SALA', '2026/2', 4),
    ])
    expect(result).toHaveLength(3)
  })
})

describe('omitExamplesAlreadyStored', () => {
  it('descarta o exemplo que já existe no banco e preserva os demais', () => {
    const stored = [make('uuid-real', 'SALA — Agendamento')]
    const examples = [make('1', 'sala — agendamento'), make('2', 'ReciclaTech')]
    expect(omitExamplesAlreadyStored(stored, examples).map((project) => project.id)).toEqual(['2'])
  })

  it('não remove duplicados que estão só entre os projetos do banco', () => {
    const stored = [make('a', 'Mesmo'), make('b', 'Mesmo')]
    expect(omitExamplesAlreadyStored(stored, [])).toEqual([])
    expect(stored).toHaveLength(2)
  })
})
