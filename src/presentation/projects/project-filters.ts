import type { ListedProject } from '@/application/projects/list-projects'

export interface Filters {
  query: string
  verified: boolean
  unverified: boolean
  cycle: string
  semesters: number[]
  stack: string[]
  languages: string[]
  themes: string[]
  advisor: string
}

export const EMPTY_FILTERS: Filters = {
  query: '',
  verified: false,
  unverified: false,
  cycle: '',
  semesters: [],
  stack: [],
  languages: [],
  themes: [],
  advisor: '',
}

export type SortKey = 'recent' | 'old' | 'az' | 'popular'
export const SORT_LABEL: Record<SortKey, string> = {
  recent: 'Mais recentes',
  old: 'Mais antigos',
  az: 'A–Z',
  popular: 'Mais acessados',
}

export function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export function applyFilters(list: ListedProject[], f: Filters): ListedProject[] {
  const q = normalize(f.query.trim())
  return list.filter((p) => {
    if (q) {
      const text = [p.title, p.summary, p.advisor.name, p.theme, ...p.languages, ...p.stack].join(
        ' ',
      )
      if (!normalize(text).includes(q)) return false
    }
    if (f.verified && !f.unverified && !p.verified) return false
    if (f.unverified && !f.verified && p.verified) return false
    if (f.cycle && p.cycle !== f.cycle) return false
    if (f.semesters.length && !f.semesters.includes(p.semester)) return false
    if (f.stack.length && !f.stack.some((s) => p.stack.includes(s))) return false
    if (f.languages.length && !f.languages.some((l) => p.languages.includes(l))) return false
    if (f.themes.length && !f.themes.includes(p.theme)) return false
    if (f.advisor && p.advisor.email !== f.advisor) return false
    return true
  })
}

export function sortProjects(list: ListedProject[], sort: SortKey): ListedProject[] {
  const copy = [...list]
  const byTitle = (a: ListedProject, b: ListedProject) => a.title.localeCompare(b.title, 'pt-BR')
  if (sort === 'az') return copy.sort(byTitle)
  if (sort === 'popular') {
    return copy.sort((a, b) => (b.accessCount ?? 0) - (a.accessCount ?? 0) || byTitle(a, b))
  }
  const dir = sort === 'recent' ? -1 : 1
  return copy.sort((a, b) => dir * a.cycle.localeCompare(b.cycle) || byTitle(a, b))
}

export interface Option<T> {
  value: T
  count: number
}
export interface Facets {
  cycles: Option<string>[]
  semesters: Option<number>[]
  stack: Option<string>[]
  languages: Option<string>[]
  themes: Option<string>[]
  advisors: { value: string; label: string; count: number }[]
}

function tally(values: string[]): Option<string>[] {
  const map = new Map<string, number>()

  values.forEach((v) => {
    map.set(v, (map.get(v) ?? 0) + 1)
  })

  return [...map].map(([value, count]) => ({ value, count }))
}
const byCount = (a: Option<string>, b: Option<string>) =>
  b.count - a.count || a.value.localeCompare(b.value, 'pt-BR')

export function getFacets(list: ListedProject[]): Facets {
  const advisors = new Map<string, { value: string; label: string; count: number }>()
  list.forEach((p) => {
    const cur = advisors.get(p.advisor.email)
    advisors.set(p.advisor.email, {
      value: p.advisor.email,
      label: p.advisor.name,
      count: (cur?.count ?? 0) + 1,
    })
  })
  return {
    cycles: tally(list.map((p) => p.cycle)).sort((a, b) => b.value.localeCompare(a.value)),
    semesters: [1, 2, 3, 4, 5, 6].map((n) => ({
      value: n,
      count: list.filter((p) => p.semester === n).length,
    })),
    stack: tally(list.flatMap((p) => p.stack)).sort(byCount),
    languages: tally(list.flatMap((p) => p.languages)).sort(byCount),
    themes: tally(list.map((p) => p.theme)).sort((a, b) => a.value.localeCompare(b.value, 'pt-BR')),
    advisors: [...advisors.values()].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
  }
}

export interface Chip {
  id: string
  label: string
  verified?: boolean
}

export function getChips(f: Filters, advisors: Facets['advisors']): Chip[] {
  const chips: Chip[] = []

  if (f.query) chips.push({ id: 'q', label: `Busca: “${f.query}”` })

  if (f.cycle) chips.push({ id: 'cycle', label: f.cycle })

  f.semesters.forEach((s) => {
    chips.push({ id: `sem:${s}`, label: `DSM ${s}º` })
  })

  f.stack.forEach((s) => {
    chips.push({ id: `stack:${s}`, label: s })
  })

  f.languages.forEach((l) => {
    chips.push({ id: `lang:${l}`, label: l })
  })

  f.themes.forEach((t) => {
    chips.push({ id: `theme:${t}`, label: t })
  })

  if (f.advisor) {
    chips.push({
      id: 'advisor',
      label: advisors.find((a) => a.value === f.advisor)?.label ?? 'Orientador',
    })
  }

  if (f.verified) {
    chips.push({ id: 'verified', label: 'PI Verificado', verified: true })
  }

  if (f.unverified) {
    chips.push({ id: 'unverified', label: 'Não verificados' })
  }

  return chips
}

export function removeChip(f: Filters, id: string): Filters {
  const [kind, ...rest] = id.split(':')
  const v = rest.join(':')
  switch (kind) {
    case 'q':
      return { ...f, query: '' }
    case 'verified':
      return { ...f, verified: false }
    case 'unverified':
      return { ...f, unverified: false }
    case 'cycle':
      return { ...f, cycle: '' }
    case 'sem':
      return { ...f, semesters: f.semesters.filter((x) => String(x) !== v) }
    case 'stack':
      return { ...f, stack: f.stack.filter((x) => x !== v) }
    case 'lang':
      return { ...f, languages: f.languages.filter((x) => x !== v) }
    case 'theme':
      return { ...f, themes: f.themes.filter((x) => x !== v) }
    case 'advisor':
      return { ...f, advisor: '' }
    default:
      return f
  }
}
