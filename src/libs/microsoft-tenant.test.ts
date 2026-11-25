import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MICROSOFT_TENANT,
  isMultiTenantAuthority,
  resolveMicrosoftTenant,
} from './microsoft-tenant'

describe('resolveMicrosoftTenant', () => {
  it('usa organizations quando a variável não existe', () => {
    expect(resolveMicrosoftTenant(undefined)).toBe(DEFAULT_MICROSOFT_TENANT)
  })

  it('usa organizations quando a variável está vazia ou só com espaços', () => {
    expect(resolveMicrosoftTenant('')).toBe(DEFAULT_MICROSOFT_TENANT)
    expect(resolveMicrosoftTenant('   ')).toBe(DEFAULT_MICROSOFT_TENANT)
  })

  it('mantém o tenant informado, sem espaços nas pontas', () => {
    expect(resolveMicrosoftTenant(' 11111111-2222-3333-4444-555555555555 ')).toBe(
      '11111111-2222-3333-4444-555555555555',
    )
  })
})

describe('isMultiTenantAuthority', () => {
  it('reconhece as autoridades que aceitam qualquer tenant', () => {
    expect(isMultiTenantAuthority('organizations')).toBe(true)
    expect(isMultiTenantAuthority('common')).toBe(true)
    expect(isMultiTenantAuthority('Consumers')).toBe(true)
  })

  it('não trata um tenant específico como multi-tenant', () => {
    expect(isMultiTenantAuthority('11111111-2222-3333-4444-555555555555')).toBe(false)
    expect(isMultiTenantAuthority('fatec.sp.gov.br')).toBe(false)
  })
})
