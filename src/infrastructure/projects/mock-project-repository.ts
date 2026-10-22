import type { Project } from '@/domain/enterprise/entities/project'
import type { ProjectRepository } from '@/domain/enterprise/repositories/project-repository'
import { MOCK_PROJECTS } from './mock-projects'

export class MockProjectRepository implements ProjectRepository {
  async findAll(): Promise<Project[]> {
    return MOCK_PROJECTS
  }

  async findById(id: string): Promise<Project | null> {
    return MOCK_PROJECTS.find((project) => project.id === id) ?? null
  }
}
