import { type Either, left, right } from '@/core/either'
import type { ProjectLinkSet } from '@/domain/enterprise/entities/project-details'
import { InvalidProjectError } from '@/domain/enterprise/errors/invalid-project-error'
import {
  type ProjectFieldsInput,
  parseProjectFields,
  parseProjectLinks,
} from './project-fields'

export type ProjectEditScope = 'full' | 'artifacts'

export type UpdateProjectInput =
  | { scope: 'full'; fields: ProjectFieldsInput }
  | { scope: 'artifacts'; links: ProjectLinkSet }

export function parseUpdateProjectInput(
  body: unknown,
  scope: ProjectEditScope,
): Either<InvalidProjectError, UpdateProjectInput> {
  if (!body || typeof body !== 'object') {
    return left(new InvalidProjectError('Informe os dados do projeto.'))
  }
  const data = body as Record<string, unknown>

  if (scope === 'artifacts') {
    const links = parseProjectLinks(data)
    if (links.isLeft()) return left(links.value)
    return right({ scope, links: links.value })
  }

  const fields = parseProjectFields(data)
  if (fields.isLeft()) return left(fields.value)
  return right({ scope, fields: fields.value })
}
