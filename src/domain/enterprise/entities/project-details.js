export const PROJECT_LINK_LABELS = {
  repository: 'Repositório',
  live: 'Site no ar',
  prototype: 'Protótipo',
}
export function splitProjectLinks(links) {
  const result = {
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
export function buildProjectLinks(set) {
  const links = []
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
export function buildTechnologyGroups(languages, stack) {
  return [
    ...(languages.length ? [{ title: 'Linguagens', icon: 'fi-rr-code', items: languages }] : []),
    ...(stack.length
      ? [{ title: 'Tecnologias & Ferramentas', icon: 'fi-rr-layers', items: stack }]
      : []),
  ]
}
