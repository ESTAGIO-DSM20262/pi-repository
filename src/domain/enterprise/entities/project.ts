export type ProjectStatus = 'publicado' | 'em_andamento'

export interface ProjectTeamAssignment {
  studentEmail: string
  roleTitle?: string
  isLeader?: boolean
}

export interface ProjectTeamMember {
  studentEmail?: string
  name: string
  roleTitle?: string
  isLeader?: boolean
  githubUrl?: string
  linkedinUrl?: string
}

export interface ProjectTechnologyGroup {
  title: string
  icon: string
  items: string[]
}

export interface ProjectExternalLink {
  label: string
  url?: string
  icon?: string
}

export type ProjectImageOrientation = 'horizontal' | 'vertical'

export interface ProjectImage {
  title: string
  url: string
  orientation: ProjectImageOrientation
}

export interface ProjectAdvisor {
  email: string
  name: string
  githubUrl?: string
  linkedinUrl?: string
}

export interface ProjectPublicDetails {
  courseLabel?: string
  overview?: string
  team?: ProjectTeamMember[]
  technologyGroups?: ProjectTechnologyGroup[]
  images?: ProjectImage[]
  externalLinks?: ProjectExternalLink[]
}

export interface Project {
  id: string
  title: string
  summary: string
  cycle: string
  semester: number
  advisor: ProjectAdvisor
  coAdvisors?: ProjectAdvisor[]
  memberEmails: string[]
  teamMembers?: ProjectTeamMember[]
  languages: string[]
  stack: string[]
  theme: string
  status: ProjectStatus
  verified: boolean
  active?: boolean
  accessCount?: number
  cover: { icon: string; label: string; tone: 'red' | 'blue' | 'slate' }
  publicDetails?: ProjectPublicDetails
}
