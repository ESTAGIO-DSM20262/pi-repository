import * as XLSX from 'xlsx'
import {
  cellText,
  findColumn,
  normalizeHeader,
  splitListCell,
} from '@/application/spreadsheet/sheet-cells'
import type { ProjectStatus } from '@/domain/enterprise/entities/project'
import {
  DEFAULT_PROJECT_LINK_ICON,
  PROJECT_LINK_PRESETS,
  type ProjectLinkInput,
} from '@/domain/enterprise/entities/project-details'
import { MAX_PROJECT_IMPORT_ROWS } from './project-import-limits'

export interface ImportedProjectRow {
  sheet: string
  rowNumber: number
  title: string
  summary: string
  overview: string
  cycle: string
  semester: number
  course: string
  theme: string
  status: ProjectStatus
  advisorEmail: string
  coAdvisorEmails: string[]
  studentEmails: string[]
  leaderEmail: string
  languages: string[]
  stack: string[]
  links: ProjectLinkInput[]
}

export interface ProjectImportRowError {
  sheet: string
  rowNumber: number
  title: string
  reason: string
}

export interface ProjectImportParseResult {
  rows: ImportedProjectRow[]
  errors: ProjectImportRowError[]
  sheetNames: string[]
}

interface ParsedGrid {
  rows: ImportedProjectRow[]
  errors: ProjectImportRowError[]
}

const COLUMN_HEADERS = {
  title: ['Título do projeto', 'Título', 'Nome do projeto', 'Projeto'],
  summary: ['Resumo', 'Resumo do projeto'],
  overview: ['Descrição detalhada', 'Descrição', 'Descrição do projeto'],
  cycle: ['Ciclo', 'Ciclo letivo', 'Período letivo'],
  semester: ['Semestre', 'Semestre letivo'],
  course: ['Curso', 'Curso do projeto'],
  theme: ['Tema', 'Tema do projeto'],
  status: ['Situação', 'Status'],
  advisor: ['Orientador principal', 'E-mail do orientador principal', 'Orientador'],
  coAdvisors: ['Orientadores adicionais', 'Professores adicionais', 'Coorientadores'],
  students: ['E-mails dos alunos', 'Alunos', 'Integrantes'],
  leader: ['Líder do grupo', 'Líder', 'E-mail do líder'],
  languages: ['Linguagens', 'Linguagens de programação'],
  stack: ['Tecnologias e ferramentas', 'Tecnologias', 'Stack', 'Ferramentas'],
} as const

const LINK_COLUMNS = [
  { title: 'Repositório', headers: ['Repositório', 'Link do repositório'] },
  { title: 'Site no ar', headers: ['Site no ar', 'Site'] },
  { title: 'Protótipo', headers: ['Protótipo'] },
  { title: 'Vídeo de apresentação', headers: ['Vídeo do projeto', 'Vídeo', 'Link do vídeo'] },
] as const

const IN_PROGRESS_VALUES = ['emandamento', 'andamento', 'emdesenvolvimento']
const PUBLISHED_VALUES = ['publicado', 'concluido', 'concluida', 'finalizado', 'encerrado']

function parseStatus(value: string): ProjectStatus | null {
  const normalized = normalizeHeader(value)
  if (!normalized || IN_PROGRESS_VALUES.includes(normalized)) return 'em_andamento'
  if (PUBLISHED_VALUES.includes(normalized)) return 'publicado'
  return null
}

function parseSemester(value: string): number | null {
  const match = /\d+/.exec(value)
  if (!match) return null
  const semester = Number(match[0])
  return Number.isInteger(semester) && semester >= 1 && semester <= 6 ? semester : null
}

function normalizeCycle(value: string): string {
  return value.replace(/^(\d{4})\s*[-.]\s*([12])$/, '$1/$2')
}

function normalizeUrl(value: string): string {
  if (!value || /^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value
  return `https://${value}`
}

function linkIcon(title: string): string {
  const preset = PROJECT_LINK_PRESETS.find((item) => item.title === title)
  return preset?.icon ?? DEFAULT_PROJECT_LINK_ICON
}

function emailList(value: string): string[] {
  return splitListCell(value.toLowerCase())
}

export function parseProjectGrid(grid: unknown[][], sheetName: string): ParsedGrid | null {
  if (grid.length === 0) return null

  const headers = grid[0].map(normalizeHeader)
  const columns = {
    title: findColumn(headers, [...COLUMN_HEADERS.title]),
    summary: findColumn(headers, [...COLUMN_HEADERS.summary]),
    overview: findColumn(headers, [...COLUMN_HEADERS.overview]),
    cycle: findColumn(headers, [...COLUMN_HEADERS.cycle]),
    semester: findColumn(headers, [...COLUMN_HEADERS.semester]),
    course: findColumn(headers, [...COLUMN_HEADERS.course]),
    theme: findColumn(headers, [...COLUMN_HEADERS.theme]),
    status: findColumn(headers, [...COLUMN_HEADERS.status]),
    advisor: findColumn(headers, [...COLUMN_HEADERS.advisor]),
    coAdvisors: findColumn(headers, [...COLUMN_HEADERS.coAdvisors]),
    students: findColumn(headers, [...COLUMN_HEADERS.students]),
    leader: findColumn(headers, [...COLUMN_HEADERS.leader]),
    languages: findColumn(headers, [...COLUMN_HEADERS.languages]),
    stack: findColumn(headers, [...COLUMN_HEADERS.stack]),
  }
  if (columns.title < 0 || columns.summary < 0) return null

  const linkColumns = LINK_COLUMNS.map((column) => ({
    title: column.title,
    index: findColumn(headers, [...column.headers]),
  }))
  const read = (row: unknown[], index: number) => (index >= 0 ? cellText(row[index]) : '')

  const rows: ImportedProjectRow[] = []
  const errors: ProjectImportRowError[] = []

  for (let index = 1; index < grid.length; index += 1) {
    const row = grid[index]
    if (!row || row.every((cell) => cellText(cell) === '')) continue

    const rowNumber = index + 1
    const title = read(row, columns.title)
    const semester = parseSemester(read(row, columns.semester))
    const status = parseStatus(read(row, columns.status))
    const fail = (reason: string) => errors.push({ sheet: sheetName, rowNumber, title, reason })

    if (semester === null) {
      fail('Semestre inválido. Informe um número de 1 a 6.')
      continue
    }
    if (status === null) {
      fail('Situação inválida. Use “Em andamento” ou “Concluído”.')
      continue
    }

    const links = linkColumns.flatMap((column) => {
      const url = normalizeUrl(read(row, column.index))
      return url ? [{ title: column.title, url, icon: linkIcon(column.title) }] : []
    })

    rows.push({
      sheet: sheetName,
      rowNumber,
      title,
      summary: read(row, columns.summary),
      overview: read(row, columns.overview),
      cycle: normalizeCycle(read(row, columns.cycle)),
      semester,
      course: read(row, columns.course),
      theme: read(row, columns.theme),
      status,
      advisorEmail: read(row, columns.advisor).toLowerCase(),
      coAdvisorEmails: emailList(read(row, columns.coAdvisors)),
      studentEmails: emailList(read(row, columns.students)),
      leaderEmail: read(row, columns.leader).toLowerCase(),
      languages: splitListCell(read(row, columns.languages)),
      stack: splitListCell(read(row, columns.stack)),
      links,
    })
  }

  return { rows, errors }
}

export function parseProjectWorkbook(bytes: Uint8Array): ProjectImportParseResult {
  const workbook = XLSX.read(bytes, { type: 'array' })
  const rows: ImportedProjectRow[] = []
  const errors: ProjectImportRowError[] = []
  const sheetNames: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) continue

    const grid = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    })
    const parsed = parseProjectGrid(grid, sheetName)
    if (!parsed) continue

    sheetNames.push(sheetName)
    rows.push(...parsed.rows)
    errors.push(...parsed.errors)
  }

  if (sheetNames.length === 0) {
    throw new Error(
      'Não encontrei a aba Projetos com as colunas Título e Resumo. Baixe o modelo e preencha a aba Projetos.',
    )
  }
  if (rows.length === 0 && errors.length === 0) {
    throw new Error('A planilha não tem nenhum projeto preenchido.')
  }
  if (rows.length + errors.length > MAX_PROJECT_IMPORT_ROWS) {
    throw new Error(
      `A planilha contém ${rows.length + errors.length} projetos. O limite é de ${MAX_PROJECT_IMPORT_ROWS} por envio.`,
    )
  }

  return { rows, errors, sheetNames }
}
