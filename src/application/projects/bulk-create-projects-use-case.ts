import type { UseCase } from '@/core/application/use-case'
import { type Either, left, right } from '@/core/either'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'
import type { ProjectRepository } from '@/domain/enterprise/repositories/project-repository'
import type { ProjectUserDirectory } from '@/domain/enterprise/repositories/project-user-directory'
import { CreateProjectUseCase } from './create-project-use-case'
import { projectIdentity } from './dedupe-projects'
import type { ImportedProjectRow } from './project-import'
import { ProjectOperationError } from './project-operation-error'

interface BulkCreateProjectsRequest {
  sessionUserId: string
  rows: ImportedProjectRow[]
}

export interface BulkProjectRowResult {
  sheet: string
  rowNumber: number
  title: string
}

export interface BulkCreatedProject extends BulkProjectRowResult {
  id: string
}

export interface BulkRejectedProject extends BulkProjectRowResult {
  reason: string
}

export interface BulkCreateProjectsResponse {
  created: BulkCreatedProject[]
  skipped: BulkRejectedProject[]
  errors: BulkRejectedProject[]
}

export const DUPLICATE_IN_SHEET_REASON = 'Projeto repetido na própria planilha.'
export const DUPLICATE_EXISTING_REASON =
  'Já existe um projeto com este título no mesmo ciclo e semestre.'
export const UNEXPECTED_ROW_REASON = 'Falha inesperada ao cadastrar este projeto.'

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function projectDuplicateKey(title: string, cycle: string, semester: number) {
  return projectIdentity({ title, cycle, semester })
}

function missingFrom(requested: string[], found: Set<string>) {
  return requested.filter((email) => !found.has(email))
}

type BulkCreateProjectsOutput = Either<ProjectOperationError, BulkCreateProjectsResponse>

export class BulkCreateProjectsUseCase
  implements UseCase<BulkCreateProjectsRequest, BulkCreateProjectsOutput>
{
  constructor(
    private readonly projects: ProjectRepository,
    private readonly users: ProjectUserDirectory,
    private readonly reader: ProjectReader,
  ) {}

  async execute({
    sessionUserId,
    rows,
  }: BulkCreateProjectsRequest): Promise<BulkCreateProjectsOutput> {
    if (!sessionUserId) {
      return left(new ProjectOperationError('É necessário entrar no sistema.', 401))
    }

    const account = await this.users.findActiveAccountById(sessionUserId)
    if (!account || (account.role !== 'admin' && account.role !== 'professor')) {
      return left(
        new ProjectOperationError(
          'Somente professores e administradores podem cadastrar projetos.',
          403,
        ),
      )
    }

    const accountEmail = normalize(account.email)
    const existingProjects = await this.reader.findAll()
    const existingKeys = new Set(
      existingProjects.map((project) =>
        projectDuplicateKey(project.title, project.cycle, project.semester),
      ),
    )

    const requestedStudents = [...new Set(rows.flatMap((row) => row.studentEmails))]
    const requestedAdvisors = [
      ...new Set(rows.flatMap((row) => [row.advisorEmail, ...row.coAdvisorEmails]).filter(Boolean)),
    ]
    const [students, advisors] = await Promise.all([
      this.users.findActiveStudentsByEmails(requestedStudents),
      this.users.findActiveAdvisorsByEmails(requestedAdvisors),
    ])
    const activeStudents = new Set(students.map((student) => normalize(student.email)))
    const activeAdvisors = new Set(advisors.map((advisor) => normalize(advisor.email)))

    const createProject = new CreateProjectUseCase(this.projects, this.users)
    const created: BulkCreatedProject[] = []
    const skipped: BulkRejectedProject[] = []
    const errors: BulkRejectedProject[] = []
    const seenKeys = new Set<string>()

    for (const row of rows) {
      const identity = { sheet: row.sheet, rowNumber: row.rowNumber, title: row.title }
      const reject = (reason: string) => errors.push({ ...identity, reason })

      const key = projectDuplicateKey(row.title, row.cycle, row.semester)
      if (row.title && seenKeys.has(key)) {
        skipped.push({ ...identity, reason: DUPLICATE_IN_SHEET_REASON })
        continue
      }
      if (row.title && existingKeys.has(key)) {
        skipped.push({ ...identity, reason: DUPLICATE_EXISTING_REASON })
        continue
      }
      seenKeys.add(key)

      let advisorEmail = normalize(row.advisorEmail)
      if (account.role === 'professor') {
        if (advisorEmail && advisorEmail !== accountEmail) {
          reject(
            'Professores só cadastram projetos em que são o orientador principal. Deixe esta coluna em branco.',
          )
          continue
        }
        advisorEmail = accountEmail
      } else if (!advisorEmail) {
        reject('Informe o e-mail do orientador principal.')
        continue
      } else if (!activeAdvisors.has(advisorEmail)) {
        reject(`Orientador principal não encontrado ou inativo: ${advisorEmail}.`)
        continue
      }

      const missingCoAdvisors = missingFrom(row.coAdvisorEmails, activeAdvisors)
      if (missingCoAdvisors.length > 0) {
        reject(
          `Orientadores adicionais não encontrados ou inativos: ${missingCoAdvisors.join(', ')}.`,
        )
        continue
      }

      const missingStudents = missingFrom(row.studentEmails, activeStudents)
      if (missingStudents.length > 0) {
        reject(`Alunos não encontrados ou inativos: ${missingStudents.join(', ')}.`)
        continue
      }

      const leaderEmail = normalize(row.leaderEmail)
      if (leaderEmail && !row.studentEmails.includes(leaderEmail)) {
        reject('O líder do grupo precisa estar na lista de alunos do projeto.')
        continue
      }

      try {
        const result = await createProject.execute({
          sessionUserId,
          body: {
            title: row.title,
            summary: row.summary,
            overview: row.overview,
            cycle: row.cycle,
            semester: row.semester,
            theme: row.theme,
            status: row.status,
            advisorEmail,
            coAdvisorEmails: row.coAdvisorEmails,
            studentEmails: row.studentEmails,
            teamAssignments: row.studentEmails.map((studentEmail) => ({
              studentEmail,
              isLeader: studentEmail === leaderEmail,
            })),
            languages: row.languages,
            stack: row.stack,
            links: row.links,
            tasks: [],
          },
        })
        if (result.isLeft()) {
          reject(result.value.message)
          continue
        }
        created.push({ ...identity, id: result.value.id })
        existingKeys.add(key)
      } catch {
        reject(UNEXPECTED_ROW_REASON)
      }
    }

    return right({ created, skipped, errors })
  }
}
