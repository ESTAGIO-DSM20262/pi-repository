import type { Project } from '@/domain/enterprise/entities/project'
import type { ProjectReader } from '@/domain/enterprise/repositories/project-reader'

export class InMemoryProjectReader implements ProjectReader {
  constructor(private readonly items: Project[] = []) {}

  async findAll() {
    return this.items
  }

  async findById(id: string) {
    return this.items.find((item) => item.id === id) ?? null
  }
}
