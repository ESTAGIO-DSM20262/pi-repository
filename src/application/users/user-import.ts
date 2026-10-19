import * as XLSX from 'xlsx'
import type { Role } from '@/domain/enterprise/entities/role'

export interface ImportedUserRow {
  name: string
  email: string
  role: Role
  registrationNumber: string
  course: string
  sheet: string
  rowNumber: number
}

export interface ImportParseResult {
  rows: ImportedUserRow[]
  errors: Array<{ sheet: string; rowNumber: number; reason: string }>
  sheetNames: string[]
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]/g, '')
}

function cellText(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .trim()
}

function findColumn(headers: string[], candidates: string[]): number {
  const normalizedCandidates = candidates.map(normalizeHeader)
  return headers.findIndex((header) => normalizedCandidates.includes(header))
}

function parseRole(value: string, sheetName: string): Role | null {
  const role = normalizeHeader(value)
  if (['aluno', 'aluna', 'estudante', 'student'].includes(role)) return 'student'
  if (['professor', 'professora', 'docente', 'teacher'].includes(role)) return 'professor'
  if (['admin', 'administrador', 'administradora', 'administrator'].includes(role)) return 'admin'

  const sheet = normalizeHeader(sheetName)
  if (sheet.includes('aluno')) return 'student'
  if (sheet.includes('professor')) return 'professor'

  return null
}

export function parseUserWorkbook(bytes: Uint8Array): ImportParseResult {
  const workbook = XLSX.read(bytes, { type: 'array' })
  const rows: ImportedUserRow[] = []
  const errors: ImportParseResult['errors'] = []
  const sheetNames = workbook.SheetNames

  if (sheetNames.length === 0) throw new Error('O arquivo não contém nenhuma aba para importar.')

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) continue

    const grid = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    })

    if (grid.length < 2) continue

    const headers = grid[0].map(normalizeHeader)
    const nameIndex = findColumn(headers, [
      'Nome Aluno',
      'Professores DSM',
      'Nome',
      'Nome Completo',
      'Nome do Usuário',
    ])
    const emailIndex = findColumn(headers, [
      'E-mail',
      'Email',
      'E-mail Institucional',
      'Email Institucional',
    ])
    const registrationIndex = findColumn(headers, [
      'RA',
      'Registro',
      'RA / Registro Acadêmico',
      'Registro Acadêmico',
      'Matrícula',
      'Matrícula Funcional',
    ])
    const courseIndex = findColumn(headers, ['Curso', 'Curso Tecnológico Vinculado'])
    const roleIndex = findColumn(headers, ['Perfil', 'Papel', 'Role'])

    if (nameIndex < 0 || emailIndex < 0) {
      const hasData = grid.slice(1).some((row) => row.some((cell) => cellText(cell) !== ''))
      if (
        hasData &&
        (normalizeHeader(sheetName).includes('aluno') ||
          normalizeHeader(sheetName).includes('professor'))
      ) {
        errors.push({
          sheet: sheetName,
          rowNumber: 1,
          reason: 'Cabeçalhos não reconhecidos. Verifique a coluna de nome e E-mail.',
        })
      }
      continue
    }

    for (let index = 1; index < grid.length; index += 1) {
      const row = grid[index]
      if (!row || row.every((cell) => cellText(cell) === '')) continue

      const name = cellText(row[nameIndex])
      const email = cellText(row[emailIndex]).toLowerCase()
      const roleValue = roleIndex >= 0 ? cellText(row[roleIndex]) : ''
      const role = parseRole(roleValue, sheetName)
      const registrationNumber = registrationIndex >= 0 ? cellText(row[registrationIndex]) : ''
      const course = courseIndex >= 0 ? cellText(row[courseIndex]) : ''
      const rowNumber = index + 1

      if (!role) {
        errors.push({
          sheet: sheetName,
          rowNumber,
          reason: 'Não foi possível identificar o perfil pela aba ou coluna Perfil.',
        })
        continue
      }

      rows.push({ name, email, role, registrationNumber, course, sheet: sheetName, rowNumber })
    }
  }

  if (rows.length === 0 && errors.length === 0) {
    throw new Error(
      'Não encontrei linhas importáveis. Esperava as abas Alunos e Professores com nome e E-mail.',
    )
  }

  if (rows.length > 500)
    throw new Error(`O lote contém ${rows.length} registros. O limite é de 500 por envio.`)
  return { rows, errors, sheetNames }
}
