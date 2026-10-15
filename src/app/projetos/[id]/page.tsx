import { and, eq } from 'drizzle-orm'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import ProjectPublicView from '@/components/projects/ProjectPublicView'
import { db } from '@/db'
import { users } from '@/db/schema'
import type { Project } from '@/domain/enterprise/entities/project'
import { MockProjectRepository } from '@/infrastructure/projects/mock-project-repository'
import { auth } from '@/libs/auth'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

async function findProject(id: string): Promise<Project | null> {
  const repository = new MockProjectRepository()
  const projects = await repository.findAll()
  return projects.find((project) => project.id === id) ?? null
}

async function findPublicProject(id: string) {
  const project = await findProject(id)
  return project?.status === 'publicado' ? project : null
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params
  const project = await findPublicProject(id)

  if (!project) return { title: 'Projeto | Acervo Acadêmico' }

  return {
    title: `${project.title} | Acervo Acadêmico`,
    description: project.summary,
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const project = await findProject(id)
  if (!project) notFound()

  const session = await auth.api.getSession({ headers: await headers() })
  const sessionUserId = session?.user?.id ? String(session.user.id) : ''
  let showProjectProgress = false
  let canManageProgress = false

  if (sessionUserId) {
    const [account] = await db
      .select({ email: users.email, role: users.role, active: users.active })
      .from(users)
      .where(and(eq(users.id, sessionUserId), eq(users.active, true)))
      .limit(1)

    if (account) {
      const email = account.email.trim().toLowerCase()
      const advisorEmail = project.advisor.email.trim().toLowerCase()
      const isAdmin = account.role === 'admin'
      const isAdvisor = account.role === 'professor' && advisorEmail === email
      const isMember =
        account.role === 'student' &&
        project.memberEmails.some((memberEmail) => memberEmail.trim().toLowerCase() === email)
      const isInvolved = isAdmin || isAdvisor || isMember

      if (project.status === 'em_andamento' && !isInvolved) notFound()

      showProjectProgress = isInvolved
      canManageProgress = project.status === 'em_andamento' && (isAdmin || isAdvisor)
    }
  }

  if (project.status === 'em_andamento' && !showProjectProgress) notFound()

  return (
    <ProjectPublicView
      project={project}
      isAuthenticated={Boolean(session)}
      canManageProgress={canManageProgress}
      showProjectProgress={showProjectProgress}
    />
  )
}
