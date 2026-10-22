import { left, right } from '@/core/either'
import { InvalidProjectError } from '@/domain/enterprise/errors/invalid-project-error'
import {
  parseProjectFields,
  parseProjectLinks,
  parseProjectTeamAssignments,
} from './project-fields'
export function parseUpdateProjectInput(body, scope, existingMemberEmails = []) {
  if (!body || typeof body !== 'object') {
    return left(new InvalidProjectError('Informe os dados do projeto.'))
  }
  const data = body
  if (scope === 'artifacts') {
    const links = parseProjectLinks(data)
    if (links.isLeft()) return left(links.value)
    if (Array.isArray(data.teamAssignments)) {
      const teamAssignments = parseProjectTeamAssignments(
        existingMemberEmails,
        data.teamAssignments,
      )
      if (teamAssignments.isLeft()) return left(teamAssignments.value)
      return right({ scope, links: links.value, teamAssignments: teamAssignments.value })
    }
    return right({ scope, links: links.value })
  }
  const fields = parseProjectFields(data)
  if (fields.isLeft()) return left(fields.value)
  return right({ scope, fields: fields.value })
}
