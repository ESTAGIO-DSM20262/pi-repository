import { describe, expect, it } from 'vitest'
import { dedupeProjects } from './dedupe-projects'

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
