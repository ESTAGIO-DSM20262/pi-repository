import { headers } from 'next/headers'
import { ListProjectsUseCase } from '@/application/projects/list-projects'
import ProjectsExplorer from '@/components/projects/ProjectsExplorer'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { MockProjectRepository } from '@/infrastructure/projects/mock-project-repository'
import { auth } from '@/libs/auth'

export const instant = false

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session ? toDomainUser(session.user) : null

  const useCase = new ListProjectsUseCase(new MockProjectRepository())
  const { projects } = await useCase.execute({
    viewer: user ? { email: user.emailAddress, role: user.role } : null,
  })

  return (
    <ProjectsExplorer
      projects={projects}
      viewerRole={user?.role ?? null}
      isAuthenticated={Boolean(session)}
    />
  )
}
