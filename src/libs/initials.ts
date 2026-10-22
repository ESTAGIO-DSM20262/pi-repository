const HONORIFIC_PREFIXES = new Set([
  'prof',
  'profa',
  'professor',
  'professora',
  'dr',
  'dra',
  'doutor',
  'doutora',
  'mestre',
  'mestra',
  'msc',
  'phd',
  'esp',
  'especialista',
  'sr',
  'sra',
  'senhor',
  'senhora',
])

function normalizeNameToken(token: string): string {
  return token
    .replace(/ª/g, 'a')
    .replace(/º/g, 'o')
    .replace(/\./g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

export function getNameInitials(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return ''

  const nameParts = fullName.trim().split(/\s+/).filter(Boolean)

  while (nameParts.length > 0 && HONORIFIC_PREFIXES.has(normalizeNameToken(nameParts[0]))) {
    nameParts.shift()
  }

  return nameParts
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase('pt-BR') ?? '')
    .join('')
}

const LOWERCASE_NAME_PARTICLES = new Set([
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'del',
  'della',
  'di',
  'van',
  'von',
])

function capitalizeNamePart(part: string): string {
  return part
    .toLocaleLowerCase('pt-BR')
    .split(/([-'])/)
    .map((segment) => {
      if (segment === '-' || segment === "'") return segment
      const characters = Array.from(segment)
      if (characters.length === 0) return segment
      return characters[0].toLocaleUpperCase('pt-BR') + characters.slice(1).join('')
    })
    .join('')
}

export function formatPersonName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return ''

  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part, index) => {
      const normalized = part.toLocaleLowerCase('pt-BR')
      if (index > 0 && LOWERCASE_NAME_PARTICLES.has(normalized)) return normalized
      return capitalizeNamePart(part)
    })
    .join(' ')
}

export function comparePersonNames(
  firstName: string | null | undefined,
  secondName: string | null | undefined,
): number {
  const normalizeForSort = (name: string | null | undefined) =>
    formatPersonName(name)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
  const first = normalizeForSort(firstName)
  const second = normalizeForSort(secondName)
  return first < second ? -1 : first > second ? 1 : 0
}
