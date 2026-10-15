import type { Project } from '../entities/project'

export interface ProjectRepository {
  findAll(): Promise<Project[]>
}
