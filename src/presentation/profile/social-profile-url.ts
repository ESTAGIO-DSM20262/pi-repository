export type SocialNetwork = 'github' | 'linkedin'

export type SocialProfileUrlResult =
  | { valid: true; value: string | null }
  | { valid: false; error: string }

const ERROR_MESSAGES: Record<SocialNetwork, string> = {
  github: 'Informe um link HTTPS válido do perfil do GitHub, como https://github.com/usuario.',
  linkedin:
    'Informe um link HTTPS válido do perfil do LinkedIn, como https://www.linkedin.com/in/usuario/.',
}

const GITHUB_USERNAME = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/
const LINKEDIN_SLUG = /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/
const LINKEDIN_LEGACY_SEGMENT = /^[a-zA-Z0-9_-]+$/

/**
 * Valida e normaliza links sociais antes de persistir ou exibir URLs informadas
 * por usuários. Somente perfis HTTPS dos domínios oficiais são aceitos.
 */
export function validateSocialProfileUrl(
  value: unknown,
  network: SocialNetwork,
): SocialProfileUrlResult {
  const error = ERROR_MESSAGES[network]

  if (value === undefined || value === null) return { valid: true, value: null }
  if (typeof value !== 'string') return { valid: false, error }

  const raw = value.trim()
  if (!raw) return { valid: true, value: null }
  if (raw.length > 500 || raw.includes('\\') || raw.includes('?') || raw.includes('#')) {
    return { valid: false, error }
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { valid: false, error }
  }

  if (
    url.protocol !== 'https:' ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.port.length > 0 ||
    url.search.length > 0 ||
    url.hash.length > 0 ||
    url.pathname.includes('//')
  ) {
    return { valid: false, error }
  }

  const pathSegments = url.pathname.split('/').filter(Boolean)

  if (network === 'github') {
    if (
      url.hostname !== 'github.com' ||
      pathSegments.length !== 1 ||
      pathSegments[0].length > 39 ||
      !GITHUB_USERNAME.test(pathSegments[0])
    ) {
      return { valid: false, error }
    }

    return { valid: true, value: `https://github.com/${pathSegments[0]}` }
  }

  if (!['linkedin.com', 'www.linkedin.com'].includes(url.hostname)) {
    return { valid: false, error }
  }

  const [profileType, ...profileSegments] = pathSegments
  if (profileType?.toLowerCase() === 'in') {
    if (
      profileSegments.length !== 1 ||
      profileSegments[0].length > 100 ||
      !LINKEDIN_SLUG.test(profileSegments[0])
    ) {
      return { valid: false, error }
    }
  } else if (profileType?.toLowerCase() === 'pub') {
    if (
      profileSegments.length < 1 ||
      profileSegments.length > 7 ||
      profileSegments.some(
        (segment) => segment.length > 100 || !LINKEDIN_LEGACY_SEGMENT.test(segment),
      )
    ) {
      return { valid: false, error }
    }
  } else {
    return { valid: false, error }
  }

  return {
    valid: true,
    value: `https://www.linkedin.com/${pathSegments.join('/')}`,
  }
}

/** Retorna somente um link seguro para ser exibido como destino de navegação. */
export function getSafeSocialProfileUrl(value: unknown, network: SocialNetwork): string | null {
  const result = validateSocialProfileUrl(value, network)
  return result.valid ? result.value : null
}
