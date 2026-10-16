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
