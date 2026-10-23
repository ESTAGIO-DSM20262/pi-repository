import type { ProjectExternalLink, ProjectTechnologyGroup } from './project'

export const PROJECT_LINK_LABELS = {
  repository: 'Repositório',
  live: 'Site no ar',
  prototype: 'Protótipo',
} as const

export interface ProjectExtraLink {
  title: string
  url: string
}

export interface ProjectLinkSet {
  repositoryUrl: string | null
  liveUrl: string | null
  prototypeUrl: string | null
  extraLinks: ProjectExtraLink[]
}

export function splitProjectLinks(links: ProjectExternalLink[] | undefined): ProjectLinkSet {
  const result: ProjectLinkSet = {
    repositoryUrl: null,
    liveUrl: null,
    prototypeUrl: null,
    extraLinks: [],
  }

  for (const link of links ?? []) {
    if (!link.url) continue
    if (link.label === PROJECT_LINK_LABELS.repository && !result.repositoryUrl) {
      result.repositoryUrl = link.url
    } else if (link.label === PROJECT_LINK_LABELS.live && !result.liveUrl) {
      result.liveUrl = link.url
    } else if (link.label === PROJECT_LINK_LABELS.prototype && !result.prototypeUrl) {
      result.prototypeUrl = link.url
    } else {
      result.extraLinks.push({ title: link.label, url: link.url })
    }
  }

  return result
}

export function buildProjectLinks(set: ProjectLinkSet): ProjectExternalLink[] {
  const links: ProjectExternalLink[] = []
  if (set.repositoryUrl) {
    links.push({ label: PROJECT_LINK_LABELS.repository, url: set.repositoryUrl })
  }
  if (set.liveUrl) {
    links.push({ label: PROJECT_LINK_LABELS.live, url: set.liveUrl })
  }
  if (set.prototypeUrl) {
    links.push({ label: PROJECT_LINK_LABELS.prototype, url: set.prototypeUrl })
  }
  for (const extra of set.extraLinks) links.push({ label: extra.title, url: extra.url })
  return links
}

export function buildTechnologyGroups(
  languages: string[],
  stack: string[],
): ProjectTechnologyGroup[] {
  return [
    ...(languages.length ? [{ title: 'Linguagens', icon: 'fi-rr-code', items: languages }] : []),
    ...(stack.length
      ? [{ title: 'Tecnologias & Ferramentas', icon: 'fi-rr-layers', items: stack }]
      : []),
  ]
}
