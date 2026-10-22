import { left, right } from '@/core/either'
import { InvalidProjectError } from '@/domain/enterprise/errors/invalid-project-error'
export const MAX_TAGS = 20
export const MAX_EXTRA_LINKS = 10
const CYCLE_PATTERN = /^\d{4}\/[12]$/
export function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}
function tags(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const result = []
  for (const item of value) {
    const tag = text(item)
    const key = tag.toLocaleLowerCase('pt-BR')
    if (!tag || tag.length > 60 || seen.has(key)) continue
    seen.add(key)
    result.push(tag)
  }
  return result
}
export function emails(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => text(item).toLowerCase()).filter(Boolean))]
}
function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}
export function parseProjectLinks(data) {
  const fail = (message) => left(new InvalidProjectError(message))
  const single = [
    { value: text(data.repositoryUrl), label: 'o repositório' },
    { value: text(data.liveUrl), label: 'o site no ar' },
    { value: text(data.prototypeUrl), label: 'o protótipo' },
  ]
  for (const item of single) {
    if (item.value && (item.value.length > 300 || !isHttpsUrl(item.value))) {
      return fail(`Informe um link HTTPS válido para ${item.label}.`)
    }
  }
  const rawExtras = Array.isArray(data.extraLinks) ? data.extraLinks : []
  const extraLinks = []
  for (const raw of rawExtras) {
    const entry = raw && typeof raw === 'object' ? raw : {}
    const title = text(entry.title)
    const url = text(entry.url)
    if (!title && !url) continue
    if (title.length < 2 || title.length > 60) {
      return fail('O título de cada link adicional deve ter entre 2 e 60 caracteres.')
    }
    if (url.length > 300 || !isHttpsUrl(url)) {
      return fail(`Informe um endereço HTTPS válido para o link “${title}”.`)
    }
    extraLinks.push({ title, url })
  }
  if (extraLinks.length > MAX_EXTRA_LINKS) {
    return fail(`Cadastre no máximo ${MAX_EXTRA_LINKS} links adicionais.`)
  }
  return right({
    repositoryUrl: single[0].value || null,
    liveUrl: single[1].value || null,
    prototypeUrl: single[2].value || null,
    extraLinks,
  })
}
export function parseProjectTeamAssignments(memberEmails, value) {
  const fail = (message) => left(new InvalidProjectError(message))
  const allowedEmails = emails(memberEmails)
  const assignmentByEmail = new Map()
  const rawAssignments = Array.isArray(value) ? value : []

  for (const raw of rawAssignments) {
    if (!raw || typeof raw !== 'object') continue
    const assignment = raw
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

  return right(teamAssignments)
}

export function parseProjectFields(data) {
  const fail = (message) => left(new InvalidProjectError(message))
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
  if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
    return fail('Informe um semestre entre 1 e 12.')
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
    ...links.value,
  })
}
