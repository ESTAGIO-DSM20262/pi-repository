export type ProjectStatus = 'publicado' | 'em_andamento'

export interface ProjectTeamMember {
  studentEmail?: string
  name: string
  githubUrl?: string
  linkedinUrl?: string
}

export interface ProjectTechnologyGroup {
  title: string
  icon: string
  items: string[]
}

export interface ProjectAttachment {
  title: string
  fileType: string
  sizeLabel: string
  description: string
  url?: string
}

export interface ProjectExternalLink {
  label: string
  url?: string
}

export interface ProjectPublicDetails {
  courseLabel?: string
  overview?: string
  team?: ProjectTeamMember[]
  technologyGroups?: ProjectTechnologyGroup[]
  attachments?: ProjectAttachment[]
  externalLinks?: ProjectExternalLink[]
}

export interface Project {
  id: string
  title: string
  summary: string
  cycle: string
  semester: number
  advisor: { email: string; name: string; githubUrl?: string; linkedinUrl?: string }
  memberEmails: string[]
  teamMembers?: ProjectTeamMember[]
  languages: string[]
  stack: string[]
  theme: string
  status: ProjectStatus
  verified: boolean
  accessCount?: number
  cover: { icon: string; label: string; tone: 'red' | 'blue' | 'slate' }
  publicDetails?: ProjectPublicDetails
}
