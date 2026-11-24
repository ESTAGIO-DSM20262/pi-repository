import { type Either, left, right } from '@/core/either'
import { InvalidProjectError } from '@/domain/enterprise/errors/invalid-project-error'
import {
  type ProjectAdvisorsInput,
  type ProjectFieldsInput,
  parseProjectAdvisors,
  parseProjectFields,
} from './project-fields'

export type ProjectEditScope = 'full' | 'admin'

export interface UpdateProjectInput {
  scope: ProjectEditScope
  fields: ProjectFieldsInput
  advisors: ProjectAdvisorsInput
}

export function parseUpdateProjectInput(
  body: unknown,
  scope: ProjectEditScope,
): Either<InvalidProjectError, UpdateProjectInput> {
  if (!body || typeof body !== 'object') {
    return left(new InvalidProjectError('Informe os dados do projeto.'))
  }
  const data = body as Record<string, unknown>

  const advisors = parseProjectAdvisors(
    scope === 'admin' ? data : { coAdvisorEmails: data.coAdvisorEmails },
  )
  if (advisors.isLeft()) return left(advisors.value)

  const fields = parseProjectFields(data)
  if (fields.isLeft()) return left(fields.value)
  return right({ scope, fields: fields.value, advisors: advisors.value })
}
