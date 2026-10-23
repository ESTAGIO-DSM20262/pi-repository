import { type Either, left, right } from '@/core/either'
import { InvalidProjectError } from '@/domain/enterprise/errors/invalid-project-error'
import { type ProjectFieldsInput, parseProjectFields, text } from './project-fields'

export interface CreateProjectTaskInput {
  title: string
  description: string
  targetStudentEmail: string | null
  dueDate: string | null
}

export interface CreateProjectInput extends ProjectFieldsInput {
  advisorEmail: string
  tasks: CreateProjectTaskInput[]
}

const MAX_TASKS = 30
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false

  const timestamp = Date.parse(`${value}T00:00:00Z`)
  if (Number.isNaN(timestamp)) return false

  return new Date(timestamp).toISOString().slice(0, 10) === value
}

export function parseCreateProjectInput(
  body: unknown,
): Either<InvalidProjectError, CreateProjectInput> {
  const fail = (message: string) =>
    left<InvalidProjectError, CreateProjectInput>(new InvalidProjectError(message))

  if (!body || typeof body !== 'object') return fail('Informe os dados do projeto.')
  const data = body as Record<string, unknown>

  const advisorEmail = text(data.advisorEmail).toLowerCase()
  if (!advisorEmail) return fail('Selecione o professor orientador.')

  const fields = parseProjectFields(data)
  if (fields.isLeft()) return left(fields.value)

  const rawTasks = Array.isArray(data.tasks) ? data.tasks : []
  if (rawTasks.length > MAX_TASKS) return fail(`Cadastre no máximo ${MAX_TASKS} tarefas iniciais.`)

  const tasks: CreateProjectTaskInput[] = []
  for (const [index, raw] of rawTasks.entries()) {
    const task = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const label = `Tarefa ${index + 1}`
    const taskTitle = text(task.title)
    const description = text(task.description)
    const target = text(task.targetStudentEmail).toLowerCase()
    const dueDate = text(task.dueDate)

    if (taskTitle.length < 3 || taskTitle.length > 160) {
      return fail(`${label}: o título deve ter entre 3 e 160 caracteres.`)
    }
    if (description.length < 5 || description.length > 5000) {
      return fail(`${label}: a descrição deve ter entre 5 e 5.000 caracteres.`)
    }
    if (target && !fields.value.studentEmails.includes(target)) {
      return fail(`${label}: o responsável deve ser um dos alunos atribuídos ao projeto.`)
    }
    if (dueDate && !isValidDate(dueDate)) return fail(`${label}: informe um prazo válido.`)

    tasks.push({
      title: taskTitle,
      description,
      targetStudentEmail: target || null,
      dueDate: dueDate || null,
    })
  }

  return right({ ...fields.value, advisorEmail, tasks })
}
