import { randomUUID } from 'node:crypto'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { parseCreateProjectInput } from '@/application/projects/create-project'
import { db } from '@/db'
import { projectProgressRevisions, projectProgressTasks, projects, users } from '@/db/schema'
import type { ProjectTeamMember } from '@/domain/enterprise/entities/project'
import {
  buildProjectLinks,
  buildTechnologyGroups,
} from '@/domain/enterprise/entities/project-details'
import { auth } from '@/libs/auth'
import { getSafeSocialProfileUrl } from '@/presentation/profile/social-profile-url'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

function databaseErrorMessage(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error)
  if (/42P01|relation ["']?projects["']? does not exist/i.test(detail)) {
    return 'A tabela de projetos ainda não existe no banco. Execute src/db/migrations/20261021_projects.sql no SQL Editor do Neon e tente novamente.'
  }
  return 'Não foi possível cadastrar o projeto. Tente novamente.'
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const sessionUserId = session?.user?.id ? String(session.user.id) : ''
    if (!sessionUserId) return jsonError('É necessário entrar no sistema.', 401)

    const [account] = await db
      .select({ id: users.id, email: users.email, name: users.name, role: users.role })
      .from(users)
      .where(and(eq(users.id, sessionUserId), eq(users.active, true)))
      .limit(1)
    if (!account || (account.role !== 'admin' && account.role !== 'professor')) {
      return jsonError('Somente professores e administradores podem cadastrar projetos.', 403)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError('Envie os dados do projeto em formato JSON.', 400)
    }

    const parsed = parseCreateProjectInput(body)
    if (parsed.isLeft()) return jsonError(parsed.value.message, 400)
    const input = parsed.value

    const advisorEmail =
      account.role === 'professor' ? account.email.toLowerCase() : input.advisorEmail
    const [advisor] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(
        and(
          eq(sql<string>`lower(${users.email})`, advisorEmail),
          eq(users.role, 'professor'),
          eq(users.active, true),
        ),
      )
      .limit(1)
    if (!advisor) return jsonError('O professor orientador selecionado não é válido.', 400)

    const students = await db
      .select({
        email: users.email,
        name: users.name,
        githubUrl: users.githubUrl,
        linkedinUrl: users.linkedinUrl,
      })
      .from(users)
      .where(
        and(
          inArray(sql<string>`lower(${users.email})`, input.studentEmails),
          eq(users.role, 'student'),
          eq(users.active, true),
        ),
      )
    if (students.length !== input.studentEmails.length) {
      return jsonError('Um ou mais alunos selecionados não são válidos ou estão inativos.', 400)
    }

    const assignmentByEmail = new Map(
      input.teamAssignments.map((assignment) => [assignment.studentEmail, assignment]),
    )
    const teamMembers: ProjectTeamMember[] = students.map((student) => {
      const assignment = assignmentByEmail.get(student.email.toLowerCase())
      return {
        studentEmail: student.email.toLowerCase(),
        name: student.name,
        ...(assignment?.roleTitle ? { roleTitle: assignment.roleTitle } : {}),
        ...(assignment?.isLeader ? { isLeader: true } : {}),
        githubUrl: getSafeSocialProfileUrl(student.githubUrl, 'github') ?? undefined,
        linkedinUrl: getSafeSocialProfileUrl(student.linkedinUrl, 'linkedin') ?? undefined,
      }
    })

    const projectId = randomUUID()
    const now = new Date()
    const externalLinks = buildProjectLinks(input)

    const projectInsert = db.insert(projects).values({
      id: projectId,
      title: input.title,
      summary: input.summary,
      cycle: input.cycle,
      semester: input.semester,
      advisorEmail: advisor.email.toLowerCase(),
      advisorName: advisor.name,
      memberEmails: teamMembers.map((member) => member.studentEmail ?? ''),
      teamMembers,
      languages: input.languages,
      stack: input.stack,
      theme: input.theme,
      status: input.status,
      verified: false,
      publicDetails: {
        overview: input.overview || undefined,
        externalLinks,
        technologyGroups: buildTechnologyGroups(input.languages, input.stack),
      },
      createdByUserId: account.id,
      createdAt: now,
    })

    const taskRows = input.tasks.map((task, index) => ({
      id: randomUUID(),
      projectId,
      title: task.title,
      description: task.description,
      versionMajor: index + 1,
      versionMinor: 0,
      status: 'pending' as const,
      targetStudentEmail: task.targetStudentEmail,
      dueDate: task.dueDate,
      createdByUserId: account.id,
      createdAt: now,
      updatedAt: now,
    }))

    if (taskRows.length > 0) {
      await db.batch([
        projectInsert,
        db.insert(projectProgressTasks).values(taskRows),
        db.insert(projectProgressRevisions).values(
          taskRows.map((task) => ({
            id: randomUUID(),
            taskId: task.id,
            projectId,
            title: task.title,
            description: task.description,
            versionMajor: task.versionMajor,
            versionMinor: task.versionMinor,
            status: task.status,
            targetStudentEmail: task.targetStudentEmail,
            dueDate: task.dueDate,
            action: 'created' as const,
            changeNote: 'Tarefa inicial do projeto',
            changedByUserId: account.id,
            changedAt: now,
          })),
        ),
      ])
    } else {
      await projectInsert
    }

    return NextResponse.json(
      { id: projectId, tasksCreated: taskRows.length },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[POST /api/projects]', error)
    return jsonError(databaseErrorMessage(error), 500)
  }
}
