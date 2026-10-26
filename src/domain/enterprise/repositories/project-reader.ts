import type { Project } from '@/domain/enterprise/entities/project'

export interface ProjectReader {
  findAll(): Promise<Project[]>
  findById(id: string): Promise<Project | null>
}
