import type { Project } from '@/domain/enterprise/entities/project'

type ProjectIdentitySubject = Pick<Project, 'title' | 'cycle' | 'semester'>

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')
}

export function projectIdentity(project: ProjectIdentitySubject) {
  return [normalizeText(project.title), project.cycle, project.semester].join('|')
}

export function dedupeProjects<T extends Pick<Project, 'id' | 'title' | 'cycle' | 'semester'>>(
  projects: T[],
): T[] {
  const seenIds = new Set<string>()
  const seenIdentities = new Set<string>()
  const unique: T[] = []
  for (const project of projects) {
    const identity = projectIdentity(project)
    if (seenIds.has(project.id) || seenIdentities.has(identity)) continue
    seenIds.add(project.id)
    seenIdentities.add(identity)
    unique.push(project)
  }
  return unique
}

export function omitExamplesAlreadyStored<
  T extends Pick<Project, 'id' | 'title' | 'cycle' | 'semester'>,
>(stored: T[], examples: T[]): T[] {
  const storedIds = new Set(stored.map((project) => project.id))
  const storedIdentities = new Set(stored.map(projectIdentity))
  return examples.filter(
    (example) => !storedIds.has(example.id) && !storedIdentities.has(projectIdentity(example)),
  )
}
