export interface CourseRecord {
  id: string
  name: string
  abbreviation: string | null
  active: boolean
}

export const COURSE_NAME_MAX = 160
export const COURSE_ABBREVIATION_MAX = 20

export function normalizeCourseText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : ''
}

/** Chave de comparação: sem acentos, minúscula e só letras/números ("D.S.M." vira "dsm"). */
export function courseMatchKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]/g, '')
}

/** Formato exibido ao usuário: "DSM - Desenvolvimento de Software Multiplataforma". */
export function formatCourseWithAbbreviation(
  name: string,
  abbreviation: string | null | undefined,
): string {
  return abbreviation ? `${abbreviation} - ${name}` : name
}

export function formatCourseLabel(course: Pick<CourseRecord, 'name' | 'abbreviation'>): string {
  return formatCourseWithAbbreviation(course.name, course.abbreviation)
}

/** Encontra um curso pelo nome, pela sigla ou pelo rótulo "SIGLA - Nome" (ou "Nome (SIGLA)"). */
export function findCourse<T extends CourseRecord>(input: string, courses: T[]): T | null {
  const key = courseMatchKey(input)
  if (!key) return null
  return (
    courses.find(
      (course) =>
        courseMatchKey(course.name) === key ||
        (course.abbreviation !== null && courseMatchKey(course.abbreviation) === key) ||
        courseMatchKey(formatCourseLabel(course)) === key ||
        courseMatchKey(`${course.name} ${course.abbreviation ?? ''}`) === key,
    ) ?? null
  )
}

export type CourseInputResult =
  | { ok: true; value: { name: string; abbreviation: string | null } }
  | { ok: false; error: string }

export function validateCourseInput(
  input: { name: unknown; abbreviation: unknown },
  existing: CourseRecord[],
  ignoreId?: string,
): CourseInputResult {
  const name = normalizeCourseText(input.name)
  const abbreviation = normalizeCourseText(input.abbreviation)

  if (name.length < 2) return { ok: false, error: 'Informe o nome do curso.' }
  if (name.length > COURSE_NAME_MAX)
    return { ok: false, error: `O nome do curso deve ter no máximo ${COURSE_NAME_MAX} caracteres.` }
  if (abbreviation.length > COURSE_ABBREVIATION_MAX)
    return {
      ok: false,
      error: `A sigla deve ter no máximo ${COURSE_ABBREVIATION_MAX} caracteres.`,
    }

  const nameKey = courseMatchKey(name)
  const abbreviationKey = courseMatchKey(abbreviation)
  if (!nameKey) return { ok: false, error: 'O nome do curso precisa ter letras ou números.' }

  for (const course of existing) {
    if (course.id === ignoreId) continue
    const otherKeys = [courseMatchKey(course.name), courseMatchKey(course.abbreviation ?? '')]
    if (otherKeys.includes(nameKey) || (abbreviationKey && otherKeys.includes(abbreviationKey))) {
      return {
        ok: false,
        error: `Já existe um curso com esse nome ou sigla: ${formatCourseLabel(course)}.`,
      }
    }
  }

  return { ok: true, value: { name, abbreviation: abbreviation || null } }
}

export type UserCourseResult = { ok: true; course: string | null } | { ok: false; error: string }

/**
 * Resolve o curso informado para um usuário. Só cursos ativos podem ser atribuídos, exceto manter
 * o valor que o usuário já tem (cursos desativados ou legados não impedem editar outros campos).
 * Aluno exige curso; se houver um único curso ativo, ele é usado quando o campo vier vazio.
 */
export function resolveUserCourse(params: {
  input: unknown
  isStudent: boolean
  courses: CourseRecord[]
  currentCourse?: string | null
}): UserCourseResult {
  const value = normalizeCourseText(params.input)
  const active = params.courses.filter((course) => course.active)

  if (value && params.currentCourse && value === params.currentCourse) {
    return { ok: true, course: value }
  }

  if (!value) {
    if (!params.isStudent) return { ok: true, course: null }
    if (active.length === 1) return { ok: true, course: active[0].name }
    return { ok: false, error: 'Selecione o curso do aluno.' }
  }

  const found = findCourse(value, active)
  if (found) return { ok: true, course: found.name }
  if (!params.isStudent) return { ok: true, course: null }
  return {
    ok: false,
    error: `O curso "${value}" não está cadastrado ou está desativado. Cadastre-o na seção Cursos do painel administrativo.`,
  }
}
