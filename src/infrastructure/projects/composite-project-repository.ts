import type { Project } from '@/domain/enterprise/entities/project'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'
import { DbProjectRepository } from './db-project-repository'
import { MockProjectRepository } from './mock-project-repository'

export class CompositeProjectRepository implements ProjectReader {
  constructor(
    private readonly stored: ProjectReader = new DbProjectRepository(),
    private readonly examples: ProjectReader = new MockProjectRepository(),
  ) {}

  async findAll(): Promise<Project[]> {
    const [stored, examples] = await Promise.all([this.stored.findAll(), this.examples.findAll()])
    return [...stored, ...examples]
  }

  async findById(id: string): Promise<Project | null> {
    const stored = await this.stored.findById(id)
    return stored ?? this.examples.findById(id)
  }
}
