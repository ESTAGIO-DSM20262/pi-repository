import { type Either, left, right } from '@/core/either'
import type {
  ProjectImage,
  ProjectStatus,
  ProjectTeamAssignment,
} from '@/domain/enterprise/entities/project'
import { MAX_PROJECT_ADVISORS } from '@/domain/enterprise/entities/project-advisors'
import {
  DEFAULT_PROJECT_LINK_ICON,
  isProjectLinkIcon,
  MAX_LINK_TITLE_LENGTH,
  MAX_LINK_URL_LENGTH,
  MAX_PROJECT_LINKS,
  type ProjectLinkInput,
} from '@/domain/enterprise/entities/project-details'
import {
  isProjectImageOrientation,
  PROJECT_IMAGE_LIMITS,
} from '@/domain/enterprise/entities/project-images'
import { normalizeTechnologyList } from '@/domain/enterprise/entities/technology-catalog'
import { InvalidProjectError } from '@/domain/enterprise/errors/invalid-project-error'

export interface ProjectAdvisorsInput {
  advisorEmail: string | null
  coAdvisorEmails: string[] | undefined
}

export interface ProjectFieldsInput {
  links: ProjectLinkInput[]
  images: ProjectImage[] | undefined
  title: string
  summary: string
  overview: string
  cycle: string
  semester: number
  theme: string
  status: ProjectStatus
  languages: string[]
  stack: string[]
  studentEmails: string[]
  teamAssignments: ProjectTeamAssignment[]
}

export const MAX_TAGS = 20
const CYCLE_PATTERN = /^\d{4}\/[12]$/

export function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function tags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return normalizeTechnologyList(
    value.map((item) => text(item)),
    MAX_TAGS + 1,
  )
}

export function emails(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => text(item).toLowerCase()).filter(Boolean))]
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function parseProjectLinks(
  data: Record<string, unknown>,
): Either<InvalidProjectError, ProjectLinkInput[]> {
  const fail = (message: string) =>
    left<InvalidProjectError, ProjectLinkInput[]>(new InvalidProjectError(message))

  const raw = Array.isArray(data.links) ? data.links : []
  const links: ProjectLinkInput[] = []
  for (const item of raw) {
    const entry = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const title = text(entry.title)
    const url = text(entry.url)
    if (!title && !url) continue
    if (title.length < 2 || title.length > MAX_LINK_TITLE_LENGTH) {
      return fail(`O título de cada link deve ter entre 2 e ${MAX_LINK_TITLE_LENGTH} caracteres.`)
    }
    if (url.length > MAX_LINK_URL_LENGTH || !isHttpsUrl(url)) {
      return fail(`Informe um endereço HTTPS válido para o link “${title}”.`)
    }
    const icon = isProjectLinkIcon(entry.icon) ? entry.icon : DEFAULT_PROJECT_LINK_ICON
    links.push({ title, url, icon })
  }
  if (links.length > MAX_PROJECT_LINKS) {
    return fail(`Cadastre no máximo ${MAX_PROJECT_LINKS} links.`)
  }

  return right(links)
}

export function parseProjectImages(
  data: Record<string, unknown>,
): Either<InvalidProjectError, ProjectImage[] | undefined> {
  const fail = (message: string) =>
    left<InvalidProjectError, ProjectImage[] | undefined>(new InvalidProjectError(message))

  if (data.images === undefined) return right(undefined)
  if (!Array.isArray(data.images)) return fail('Informe a lista de imagens do projeto.')
  if (data.images.length > PROJECT_IMAGE_LIMITS.maxFiles) {
    return fail(`Cadastre no máximo ${PROJECT_IMAGE_LIMITS.maxFiles} imagens.`)
  }

  const images: ProjectImage[] = []
  for (const item of data.images) {
    const entry = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const title = text(entry.title)
    const url = text(entry.url)
    if (title.length > PROJECT_IMAGE_LIMITS.maxTitleLength) {
      return fail(
        `O título da imagem deve ter no máximo ${PROJECT_IMAGE_LIMITS.maxTitleLength} caracteres.`,
      )
    }
    if (url.length > MAX_LINK_URL_LENGTH || !isHttpsUrl(url)) {
      return fail('Cada imagem precisa de um endereço HTTPS válido.')
    }
    if (!isProjectImageOrientation(entry.orientation)) {
      return fail('Informe se cada imagem é horizontal ou vertical.')
    }
    images.push({ title, url, orientation: entry.orientation })
  }
  return right(images)
}

export function parseProjectAdvisors(
  data: Record<string, unknown>,
): Either<InvalidProjectError, ProjectAdvisorsInput> {
  const advisorEmail = text(data.advisorEmail).toLowerCase() || null
  const coAdvisorEmails =
    data.coAdvisorEmails === undefined
      ? undefined
      : emails(data.coAdvisorEmails).filter((email) => email !== advisorEmail)
  if (coAdvisorEmails && coAdvisorEmails.length > MAX_PROJECT_ADVISORS - 1) {
    return left(
      new InvalidProjectError(
        `Cadastre no máximo ${MAX_PROJECT_ADVISORS} professores orientadores.`,
      ),
    )
  }
  return right({ advisorEmail, coAdvisorEmails })
}

export function parseProjectTeamAssignments(
  memberEmails: string[],
  value: unknown,
): Either<InvalidProjectError, ProjectTeamAssignment[]> {
  const fail = (message: string) =>
    left<InvalidProjectError, ProjectTeamAssignment[]>(new InvalidProjectError(message))
  const allowedEmails = emails(memberEmails)
  const assignmentByEmail = new Map<string, ProjectTeamAssignment>()
  const rawAssignments = Array.isArray(value) ? value : []

  for (const raw of rawAssignments) {
    if (!raw || typeof raw !== 'object') continue
    const assignment = raw as Record<string, unknown>
    const studentEmail = text(assignment.studentEmail).toLowerCase()
    if (!allowedEmails.includes(studentEmail)) continue

    const roleTitle = text(assignment.roleTitle)
    if (roleTitle.length > 40) {
      return fail('A função de cada integrante deve ter no máximo 40 caracteres.')
    }

    assignmentByEmail.set(studentEmail, {
      studentEmail,
      ...(roleTitle ? { roleTitle } : {}),
      ...(assignment.isLeader === true ? { isLeader: true } : {}),
    })
  }

  const teamAssignments = allowedEmails.map(
    (studentEmail) => assignmentByEmail.get(studentEmail) ?? { studentEmail },
  )
  if (teamAssignments.filter((assignment) => assignment.isLeader).length > 1) {
    return fail('Defina apenas um integrante como líder do grupo.')
  }

  return right<InvalidProjectError, ProjectTeamAssignment[]>(teamAssignments)
}

export function parseProjectFields(
  data: Record<string, unknown>,
): Either<InvalidProjectError, ProjectFieldsInput> {
  const fail = (message: string) =>
    left<InvalidProjectError, ProjectFieldsInput>(new InvalidProjectError(message))

  const title = text(data.title)
  const summary = text(data.summary)
  const overview = text(data.overview)
  const cycle = text(data.cycle)
  const theme = text(data.theme)
  const semester = Number(data.semester)
  const status = data.status === 'publicado' ? 'publicado' : 'em_andamento'
  const languages = tags(data.languages)
  const stack = tags(data.stack)
  const studentEmails = emails(data.studentEmails)

  if (title.length < 3 || title.length > 160) {
    return fail('O título deve ter entre 3 e 160 caracteres.')
  }
  if (summary.length < 10 || summary.length > 600) {
    return fail('O resumo deve ter entre 10 e 600 caracteres.')
  }
  if (overview.length > 5000) {
    return fail('A descrição detalhada deve ter no máximo 5.000 caracteres.')
  }
  if (!CYCLE_PATTERN.test(cycle)) return fail('Informe o ciclo no formato AAAA/1 ou AAAA/2.')
  if (!Number.isInteger(semester) || semester < 1 || semester > 6) {
    return fail('Informe um semestre entre 1 e 6.')
  }
  if (theme.length < 2 || theme.length > 80) return fail('Informe o tema do projeto.')
  if (studentEmails.length === 0) return fail('Atribua pelo menos um aluno ao projeto.')

  const assignments = parseProjectTeamAssignments(studentEmails, data.teamAssignments)
  if (assignments.isLeft()) return left(assignments.value)
  const teamAssignments = assignments.value
  if (languages.length > MAX_TAGS || stack.length > MAX_TAGS) {
    return fail(`Informe no máximo ${MAX_TAGS} itens por lista de tecnologias.`)
  }

  const links = parseProjectLinks(data)
  if (links.isLeft()) return left(links.value)
  const images = parseProjectImages(data)
  if (images.isLeft()) return left(images.value)

  return right({
    title,
    summary,
    overview,
    cycle,
    semester,
    theme,
    status,
    languages,
    stack,
    studentEmails,
    teamAssignments,
    links: links.value,
    images: images.value,
  })
}
