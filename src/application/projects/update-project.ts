import { type Either, left, right } from '@/core/either'
import type { ProjectImage } from '@/domain/enterprise/entities/project'
import type { ProjectLinkInput } from '@/domain/enterprise/entities/project-details'
import { InvalidProjectError } from '@/domain/enterprise/errors/invalid-project-error'
import {
  type ProjectAdvisorsInput,
  type ProjectFieldsInput,
  parseProjectAdvisors,
  parseProjectFields,
  parseProjectImages,
  parseProjectLinks,
} from './project-fields'

export type ProjectEditScope = 'full' | 'admin'

export type UpdateProjectInput =
  | { scope: 'full'; fields: ProjectFieldsInput; advisors: ProjectAdvisorsInput }
  | {
      scope: 'admin'
      advisors: ProjectAdvisorsInput
      links: ProjectLinkInput[]
      images: ProjectImage[] | undefined
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

  if (scope === 'admin') {
    const links = parseProjectLinks(data)
    if (links.isLeft()) return left(links.value)
    const images = parseProjectImages(data)
    if (images.isLeft()) return left(images.value)
    return right({ scope, advisors: advisors.value, links: links.value, images: images.value })
  }

  const fields = parseProjectFields(data)
  if (fields.isLeft()) return left(fields.value)
  return right({ scope, fields: fields.value, advisors: advisors.value })
}
