export function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]/g, '')
}

export function cellText(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .trim()
}

export function findColumn(headers: string[], candidates: string[]): number {
  const normalizedCandidates = candidates.map(normalizeHeader)
  return headers.findIndex((header) => normalizedCandidates.includes(header))
}

export function splitListCell(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,;\n]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
}
