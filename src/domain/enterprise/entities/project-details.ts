import type { ProjectExternalLink, ProjectTechnologyGroup } from './project'

export const MAX_PROJECT_LINKS = 12
export const MAX_LINK_TITLE_LENGTH = 60
export const MAX_LINK_URL_LENGTH = 300
export const DEFAULT_PROJECT_LINK_ICON = 'fi-rr-link'

export interface ProjectLinkIconOption {
  icon: string
  label: string
}

export const PROJECT_LINK_ICONS: ProjectLinkIconOption[] = [
  { icon: 'fi-rr-code-branch', label: 'Repositório' },
  { icon: 'fi-rr-globe', label: 'Site' },
  { icon: 'fi-rr-pen-nib', label: 'Protótipo' },
  { icon: 'fi-rr-palette', label: 'Identidade visual' },
  { icon: 'fi-rr-book-alt', label: 'Documentação' },
  { icon: 'fi-rr-document', label: 'Documento' },
  { icon: 'fi-rr-file-pdf', label: 'PDF' },
  { icon: 'fi-rr-newspaper', label: 'Artigo' },
  { icon: 'fi-rr-play-circle', label: 'Vídeo' },
  { icon: 'fi-rr-presentation', label: 'Apresentação' },
  { icon: 'fi-rr-chart-pie-alt', label: 'Dashboard' },
  { icon: 'fi-rr-smartphone', label: 'Aplicativo' },
  { icon: 'fi-rr-laptop-code', label: 'Código online' },
  { icon: 'fi-rr-terminal', label: 'Linha de comando' },
  { icon: 'fi-rr-network', label: 'API' },
  { icon: 'fi-rr-database', label: 'Banco de dados' },
  { icon: 'fi-rr-cloud-download', label: 'Download' },
  { icon: 'fi-rr-cloud', label: 'Nuvem' },
  { icon: 'fi-rr-list-check', label: 'Quadro de tarefas' },
  { icon: 'fi-rr-bug', label: 'Testes' },
  { icon: 'fi-rr-shield-check', label: 'Segurança' },
  { icon: 'fi-rr-megaphone', label: 'Divulgação' },
  { icon: 'fi-rr-users', label: 'Equipe' },
  { icon: 'fi-rr-calendar', label: 'Cronograma' },
  { icon: 'fi-rr-trophy', label: 'Prêmio' },
  { icon: 'fi-rr-star', label: 'Destaque' },
  { icon: 'fi-rr-picture', label: 'Imagens' },
  { icon: 'fi-rr-envelope', label: 'Contato' },
  { icon: DEFAULT_PROJECT_LINK_ICON, label: 'Link' },
]

export interface ProjectLinkPreset {
  title: string
  icon: string
}

export const PROJECT_LINK_PRESETS: ProjectLinkPreset[] = [
  { title: 'Repositório', icon: 'fi-rr-code-branch' },
  { title: 'Site no ar', icon: 'fi-rr-globe' },
  { title: 'Protótipo', icon: 'fi-rr-pen-nib' },
  { title: 'Documentação', icon: 'fi-rr-book-alt' },
  { title: 'Vídeo de apresentação', icon: 'fi-rr-play-circle' },
  { title: 'Apresentação', icon: 'fi-rr-presentation' },
  { title: 'Aplicativo', icon: 'fi-rr-smartphone' },
  { title: 'API', icon: 'fi-rr-network' },
  { title: 'Quadro de tarefas', icon: 'fi-rr-list-check' },
]

export interface ProjectLinkInput {
  title: string
  url: string
  icon: string
}

const ICON_VALUES = new Set(PROJECT_LINK_ICONS.map((option) => option.icon))

export function isProjectLinkIcon(value: unknown): value is string {
  return typeof value === 'string' && ICON_VALUES.has(value)
}

function normalizeTitle(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR')
}

export function resolveProjectLinkIcon(link: { label: string; icon?: string }) {
  if (isProjectLinkIcon(link.icon)) return link.icon
  const preset = PROJECT_LINK_PRESETS.find(
    (item) => normalizeTitle(item.title) === normalizeTitle(link.label),
  )
  return preset?.icon ?? DEFAULT_PROJECT_LINK_ICON
}

export function toProjectLinkInputs(links: ProjectExternalLink[] | undefined): ProjectLinkInput[] {
  return (links ?? [])
    .filter((link) => link.url)
    .map((link) => ({
      title: link.label,
      url: link.url ?? '',
      icon: resolveProjectLinkIcon(link),
    }))
}

export function buildProjectLinks(inputs: ProjectLinkInput[]): ProjectExternalLink[] {
  return inputs.map((input) => ({ label: input.title, url: input.url, icon: input.icon }))
}

export function buildTechnologyGroups(
  languages: string[],
  stack: string[],
): ProjectTechnologyGroup[] {
  return [
    ...(languages.length
      ? [{ title: 'Linguagens', icon: 'fi-rr-code-simple', items: languages }]
      : []),
    ...(stack.length
      ? [{ title: 'Tecnologias & Ferramentas', icon: 'fi-rr-layers', items: stack }]
      : []),
  ]
}
