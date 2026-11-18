const LOWERCASE_CONNECTORS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du', 'del'])
const UPPERCASE_NUMERALS = new Set(['ii', 'iii', 'iv'])

function capitalize(word: string): string {
  const first = word.charAt(0)
  return first.toLocaleUpperCase('pt-BR') + word.slice(1)
}

function formatNamePart(part: string, isFirstWord: boolean): string {
  const lower = part.toLocaleLowerCase('pt-BR')
  if (!isFirstWord && LOWERCASE_CONNECTORS.has(lower)) return lower
  if (!isFirstWord && UPPERCASE_NUMERALS.has(lower)) return lower.toUpperCase()
  return lower
    .split(/(?<=[-'’])/)
    .map(capitalize)
    .join('')
}

export function formatPersonName(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part, index) => formatNamePart(part, index === 0))
    .join(' ')
}
