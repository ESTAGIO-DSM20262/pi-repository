export const DEFAULT_MICROSOFT_TENANT = 'organizations'

const MULTI_TENANT_AUTHORITIES = new Set(['organizations', 'common', 'consumers'])

export function resolveMicrosoftTenant(value: string | undefined): string {
  const tenant = value?.trim()
  return tenant ? tenant : DEFAULT_MICROSOFT_TENANT
}

export function isMultiTenantAuthority(tenant: string): boolean {
  return MULTI_TENANT_AUTHORITIES.has(tenant.trim().toLowerCase())
}
