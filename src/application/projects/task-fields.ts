import { type Either, left, right } from '@/core/either'
import { InvalidProjectError } from '@/domain/enterprise/errors/invalid-project-error'

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return !Number.isNaN(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
}

export interface TaskFieldsInput {
  title: string
  description: string
  dueDate: string | null
}

export function parseTaskFields(body: unknown): Either<InvalidProjectError, TaskFieldsInput> {
  if (!body || typeof body !== 'object') {
    return left(new InvalidProjectError('Informe os dados da tarefa.'))
  }
  const data = body as Record<string, unknown>
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const description = typeof data.description === 'string' ? data.description.trim() : ''
  const dueDate = typeof data.dueDate === 'string' ? data.dueDate.trim() : ''

  if (title.length < 3 || title.length > 160) {
    return left(new InvalidProjectError('O título deve ter entre 3 e 160 caracteres.'))
  }
  if (description.length < 5 || description.length > 5000) {
    return left(new InvalidProjectError('A descrição deve ter entre 5 e 5.000 caracteres.'))
  }
  if (dueDate && !isValidIsoDate(dueDate)) {
    return left(new InvalidProjectError('Informe uma data de entrega válida.'))
  }

  return right({ title, description, dueDate: dueDate || null })
}
