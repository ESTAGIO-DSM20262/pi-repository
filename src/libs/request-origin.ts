const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export interface OriginCheckInput {
  method: string
  pathname: string
  origin: string | null
  host: string | null
  forwardedHost: string | null
  configuredOrigin?: string | null
}

export function isUnsafeApiRequest(method: string, pathname: string): boolean {
  if (!UNSAFE_METHODS.has(method.toUpperCase())) return false
  if (!pathname.startsWith('/api/')) return false
  return !pathname.startsWith('/api/auth/')
}

function hostOf(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).host.toLowerCase()
  } catch {
    return null
  }
}

export function isTrustedOrigin({
  origin,
  host,
  forwardedHost,
  configuredOrigin,
}: Omit<OriginCheckInput, 'method' | 'pathname'>): boolean {
  if (origin === null) return true

  const originHost = hostOf(origin)
  if (!originHost) return false

  const allowedHosts = [
    forwardedHost?.split(',')[0]?.trim().toLowerCase(),
    host?.trim().toLowerCase(),
    hostOf(configuredOrigin),
  ]
  return allowedHosts.some((allowed) => allowed === originHost)
}

export function shouldRejectCrossOriginRequest(input: OriginCheckInput): boolean {
  if (!isUnsafeApiRequest(input.method, input.pathname)) return false
  return !isTrustedOrigin(input)
}
