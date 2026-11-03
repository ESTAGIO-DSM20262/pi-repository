import { describe, expect, it } from 'vitest'
import {
  getProjectAdvisors,
  isProjectActive,
  isProjectAdvisor,
  MAX_PROJECT_ADVISORS,
} from './project-advisors'

const principal = { email: 'Principal@cps.sp.gov.br', name: 'Principal' }
const satellite = { email: 'satelite@cps.sp.gov.br', name: 'Satélite' }

describe('getProjectAdvisors', () => {
  it('lista o principal primeiro e depois os adicionais', () => {
    const advisors = getProjectAdvisors({ advisor: principal, coAdvisors: [satellite] })
    expect(advisors.map((advisor) => advisor.name)).toEqual(['Principal', 'Satélite'])
  })

  it('funciona sem orientadores adicionais e descarta repetidos sem diferenciar caixa', () => {
    expect(getProjectAdvisors({ advisor: principal })).toHaveLength(1)
    const repeated = getProjectAdvisors({
      advisor: principal,
      coAdvisors: [{ email: 'principal@CPS.sp.gov.br', name: 'Repetido' }, satellite],
    })
    expect(repeated.map((advisor) => advisor.name)).toEqual(['Principal', 'Satélite'])
  })
})

describe('isProjectAdvisor', () => {
  it('reconhece principal e adicionais, ignorando caixa e espaços', () => {
    const project = { advisor: principal, coAdvisors: [satellite] }
    expect(isProjectAdvisor(project, ' PRINCIPAL@cps.sp.gov.br ')).toBe(true)
    expect(isProjectAdvisor(project, 'Satelite@cps.sp.gov.br')).toBe(true)
    expect(isProjectAdvisor(project, 'outro@cps.sp.gov.br')).toBe(false)
  })
})

describe('isProjectActive', () => {
  it('considera ativo tudo que não foi explicitamente desativado', () => {
    expect(isProjectActive({})).toBe(true)
    expect(isProjectActive({ active: true })).toBe(true)
    expect(isProjectActive({ active: false })).toBe(false)
  })

  it('limita a lista de orientadores a cinco', () => {
    expect(MAX_PROJECT_ADVISORS).toBe(5)
  })
})
