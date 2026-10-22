import { and, eq, inArray, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { parseUpdateProjectInput } from '@/application/projects/update-project'
import { db } from '@/db'
import { projectProgressTasks, projects, users } from '@/db/schema'
import type { ProjectPublicDetails, ProjectTeamMember } from '@/domain/enterprise/entities/project'
import {
  buildProjectLinks,
  buildTechnologyGroups,
} from '@/domain/enterprise/entities/project-details'
import { auth } from '@/libs/auth'
import { resolveProjectEditAccess } from '@/libs/project-edit-access'
import { getSafeSocialProfileUrl } from '@/presentation/profile/social-profile-url'

interface RouteContext {
  params: Promise<{ id: string }>
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({ headers: request.headers })
    const sessionUserId = session?.user?.id ? String(session.user.id) : ''

    const access = await resolveProjectEditAccess({ sessionUserId, projectId: id })
    if (!access.ok) return jsonError(access.message, access.status)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError('Envie os dados do projeto em formato JSON.', 400)
    }

    const parsed = parseUpdateProjectInput(body, access.scope, access.project.memberEmails)
    if (parsed.isLeft()) return jsonError(parsed.value.message, 400)
    const input = parsed.value
    const currentDetails = access.project.publicDetails ?? {}

    if (input.scope === 'artifacts') {
      const updateValues: {
        publicDetails: ProjectPublicDetails
        teamMembers?: ProjectTeamMember[]
      } = {
        publicDetails: { ...currentDetails, externalLinks: buildProjectLinks(input.links) },
      }

      if (input.teamAssignments !== undefined) {
        const assignmentByEmail = new Map(
          input.teamAssignments.map((assignment) => [assignment.studentEmail, assignment]),
        )
        const currentMembers = access.project.teamMembers?.length
          ? access.project.teamMembers
          : (currentDetails.team ?? [])
        updateValues.teamMembers = currentMembers.map((member, index) => {
          const email = (member.studentEmail ?? access.project.memberEmails[index] ?? '')
            .trim()
            .toLowerCase()
          const assignment = assignmentByEmail.get(email)
          return {
            ...member,
            studentEmail: email,
            roleTitle: assignment?.roleTitle || undefined,
            isLeader: assignment?.isLeader || undefined,
          }
        })
      }

      await db.update(projects).set(updateValues).where(eq(projects.id, id))

      return NextResponse.json({ id }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const fields = input.fields

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
          inArray(sql<string>`lower(${users.email})`, fields.studentEmails),
          eq(users.role, 'student'),
          eq(users.active, true),
        ),
      )

    const found = new Set(students.map((student) => student.email.toLowerCase()))
    const invalid = fields.studentEmails.filter((email) => !found.has(email))
    if (invalid.length > 0) {
      return jsonError(
        `Alunos inválidos ou inativos: ${invalid.join(', ')}. Remova-os do grupo para salvar.`,
        400,
      )
    }

    const removed = access.project.memberEmails
      .map((email) => email.trim().toLowerCase())
      .filter((email) => !fields.studentEmails.includes(email))

    if (removed.length > 0) {
      const assigned = await db
        .select({ email: projectProgressTasks.targetStudentEmail })
        .from(projectProgressTasks)
        .where(
          and(
            eq(projectProgressTasks.projectId, id),
            inArray(sql<string>`lower(${projectProgressTasks.targetStudentEmail})`, removed),
          ),
        )
        .limit(1)

      if (assigned.length > 0) {
        return jsonError(
          'Há tarefas atribuídas a um aluno que foi removido do grupo. Reatribua ou exclua essas tarefas no progresso do projeto antes de removê-lo.',
          409,
        )
      }
    }

    const byEmail = new Map(students.map((student) => [student.email.toLowerCase(), student]))
    const assignmentByEmail = new Map(
      fields.teamAssignments.map((assignment) => [assignment.studentEmail, assignment]),
    )
    const teamMembers: ProjectTeamMember[] = fields.studentEmails.flatMap((email) => {
      const student = byEmail.get(email)
      if (!student) return []
      const assignment = assignmentByEmail.get(email)
      return [
        {
          studentEmail: email,
          name: student.name,
          ...(assignment?.roleTitle ? { roleTitle: assignment.roleTitle } : {}),
          ...(assignment?.isLeader ? { isLeader: true } : {}),
          githubUrl: getSafeSocialProfileUrl(student.githubUrl, 'github') ?? undefined,
          linkedinUrl: getSafeSocialProfileUrl(student.linkedinUrl, 'linkedin') ?? undefined,
        },
      ]
    })

    await db
      .update(projects)
      .set({
        title: fields.title,
        summary: fields.summary,
        cycle: fields.cycle,
        semester: fields.semester,
        theme: fields.theme,
        status: fields.status,
        languages: fields.languages,
        stack: fields.stack,
        memberEmails: teamMembers.map((member) => member.studentEmail ?? ''),
        teamMembers,
        publicDetails: {
          ...currentDetails,
          overview: fields.overview || undefined,
          externalLinks: buildProjectLinks(fields),
          technologyGroups: buildTechnologyGroups(fields.languages, fields.stack),
        },
      })
      .where(eq(projects.id, id))

    return NextResponse.json({ id }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[PATCH /api/projects/[id]]', error)
    return jsonError('Não foi possível salvar as alterações do projeto. Tente novamente.', 500)
  }
}
