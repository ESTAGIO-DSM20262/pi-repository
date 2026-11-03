import { type Either, left, right } from '@/core/either'
import type { ProjectImageOrientation } from './project'

export const PROJECT_IMAGE_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxFiles: 8,
  minSidePx: 320,
  maxSidePx: 6000,
  maxTitleLength: 80,
  mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  extensions: ['png', 'jpg', 'jpeg', 'webp'],
} as const

export const PROJECT_IMAGE_ACCEPT = PROJECT_IMAGE_LIMITS.mimeTypes.join(',')

export const PROJECT_IMAGE_ORIENTATIONS: {
  value: ProjectImageOrientation
  label: string
  hint: string
}[] = [
  { value: 'horizontal', label: 'Horizontal', hint: 'Sites e sistemas web (paisagem)' },
  { value: 'vertical', label: 'Vertical', hint: 'Aplicativos mobile (retrato)' },
]

export interface ProjectImageCandidate {
  name: string
  size: number
  type: string
  width?: number
  height?: number
}

export class ProjectImageRejection {
  constructor(readonly message: string) {}
}

function formatMegabytes(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}

export function validateProjectImage(
  file: ProjectImageCandidate,
  currentCount = 0,
): Either<ProjectImageRejection, void> {
  const limits = PROJECT_IMAGE_LIMITS
  if (currentCount >= limits.maxFiles) {
    return left(new ProjectImageRejection(`Envie no máximo ${limits.maxFiles} imagens.`))
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const allowedType = (limits.mimeTypes as readonly string[]).includes(file.type)
  const allowedExtension = (limits.extensions as readonly string[]).includes(extension)
  if (!allowedType || !allowedExtension) {
    return left(new ProjectImageRejection('Use imagens nos formatos PNG, JPG ou WEBP.'))
  }
  if (file.size <= 0) return left(new ProjectImageRejection('O arquivo de imagem está vazio.'))
  if (file.size > limits.maxBytes) {
    return left(
      new ProjectImageRejection(
        `Cada imagem deve ter no máximo ${formatMegabytes(limits.maxBytes)}.`,
      ),
    )
  }
  if (file.width !== undefined && file.height !== undefined) {
    if (Math.min(file.width, file.height) < limits.minSidePx) {
      return left(
        new ProjectImageRejection(
          `A menor lateral da imagem deve ter ao menos ${limits.minSidePx} px.`,
        ),
      )
    }
    if (Math.max(file.width, file.height) > limits.maxSidePx) {
      return left(
        new ProjectImageRejection(
          `A maior lateral da imagem deve ter no máximo ${limits.maxSidePx} px.`,
        ),
      )
    }
  }
  return right(undefined)
}

export function suggestImageOrientation(width: number, height: number): ProjectImageOrientation {
  return height > width ? 'vertical' : 'horizontal'
}

export function isProjectImageOrientation(value: unknown): value is ProjectImageOrientation {
  return value === 'horizontal' || value === 'vertical'
}
