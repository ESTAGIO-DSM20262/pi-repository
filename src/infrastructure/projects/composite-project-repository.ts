import type { Project } from '@/domain/enterprise/entities/project'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'
import { DbProjectRepository } from './db-project-repository'

export class CompositeProjectRepository implements ProjectReader {
  constructor(private readonly stored: ProjectReader = new DbProjectRepository()) {}

  async findAll(): Promise<Project[]> {
    return this.stored.findAll()
  }

  async findById(id: string): Promise<Project | null> {
    return this.stored.findById(id)
  }
}
