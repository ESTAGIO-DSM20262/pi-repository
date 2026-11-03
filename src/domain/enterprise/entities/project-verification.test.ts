import { describe, expect, it } from 'vitest'
import {
  buildVerificationSummary,
  normalizeVerificationCriteria,
  type ProjectVerificationRecord,
  VERIFICATION_CRITERIA,
} from './project-verification'

const ana = { email: 'ana@cps.sp.gov.br', name: 'Profa. Ana' }
const caio = { email: 'caio@cps.sp.gov.br', name: 'Prof. Caio' }

function record(
  email: string,
  criteria: ProjectVerificationRecord['criteria'],
  role: ProjectVerificationRecord['verifierRole'] = 'professor',
): ProjectVerificationRecord {
  return {
    verifierUserId: `user-${email}`,
    verifierEmail: email,
    verifierName: email,
    verifierRole: role,
    criteria,
    verifiedAt: '2026-10-25T12:00:00.000Z',
  }
}

describe('normalizeVerificationCriteria', () => {
  it('mantém apenas critérios válidos, sem repetição e na ordem do catálogo', () => {
    expect(
      normalizeVerificationCriteria(['final_result', 'inventado', 'source_code', 'source_code', 3]),
    ).toEqual(['source_code', 'final_result'])
  })

  it('devolve lista vazia para valores que não são lista', () => {
    expect(normalizeVerificationCriteria(undefined)).toEqual([])
    expect(normalizeVerificationCriteria('source_code')).toEqual([])
  })

  it('oferece critérios com rótulo e frase para o professor marcar', () => {
    expect(VERIFICATION_CRITERIA.length).toBeGreaterThanOrEqual(5)
    expect(VERIFICATION_CRITERIA.every((item) => item.label && item.statement)).toBe(true)
  })
})

describe('buildVerificationSummary', () => {
  it('com um só orientador, o projeto fica verificado assim que ele verifica', () => {
    const summary = buildVerificationSummary(
      [ana],
      [record(ana.email, ['source_code', 'documentation'])],
    )

    expect(summary.complete).toBe(true)
    expect(summary.verifiedCount).toBe(1)
    expect(summary.criteria.map((item) => item.id)).toEqual(['source_code', 'documentation'])
    expect(summary.criteria.every((item) => item.unanimous)).toBe(true)
  })

  it('com vários orientadores, só completa quando todos verificam e indica quem falta', () => {
    const partial = buildVerificationSummary([ana, caio], [record(ana.email, ['source_code'])])

    expect(partial.complete).toBe(false)
    expect(partial.verifiedCount).toBe(1)
    expect(partial.requiredCount).toBe(2)
    expect(partial.advisors.map((item) => [item.email, item.verified])).toEqual([
      [ana.email, true],
      [caio.email, false],
    ])
  })

  it('lista os critérios marcados por pelo menos um orientador e sinaliza os não unânimes', () => {
    const summary = buildVerificationSummary(
      [ana, caio],
      [
        record(ana.email, ['source_code', 'documentation']),
        record(caio.email, ['source_code', 'final_result']),
      ],
    )

    expect(summary.complete).toBe(true)
    expect(summary.criteria.map((item) => [item.id, item.endorsedBy, item.unanimous])).toEqual([
      ['source_code', 2, true],
      ['documentation', 1, false],
      ['final_result', 1, false],
    ])
  })

  it('compara e-mails sem diferenciar maiúsculas e minúsculas', () => {
    const summary = buildVerificationSummary(
      [{ email: 'Ana@CPS.sp.gov.br', name: 'Ana' }],
      [record('ana@cps.sp.gov.br', ['source_code'])],
    )
    expect(summary.complete).toBe(true)
  })

  it('a verificação do administrador não conta para o quórum de orientadores', () => {
    const summary = buildVerificationSummary(
      [ana, caio],
      [record(ana.email, ['source_code']), record('admin@cps.sp.gov.br', ['source_code'], 'admin')],
    )

    expect(summary.complete).toBe(false)
    expect(summary.verifiedCount).toBe(1)
    expect(summary.administrators).toHaveLength(1)
    expect(summary.administrators[0].email).toBe('admin@cps.sp.gov.br')
  })

  it('ignora verificação de quem não é mais orientador do projeto', () => {
    const summary = buildVerificationSummary([ana], [record(caio.email, ['source_code'])])

    expect(summary.complete).toBe(false)
    expect(summary.criteria).toEqual([])
  })
})
