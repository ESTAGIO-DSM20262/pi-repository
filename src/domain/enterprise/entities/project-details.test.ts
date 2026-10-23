import { describe, expect, it } from 'vitest'
import { buildProjectLinks, buildTechnologyGroups, splitProjectLinks } from './project-details'

describe('project-details', () => {
  it('separa os links conhecidos dos adicionais', () => {
    const result = splitProjectLinks([
      { label: 'Repositório', url: 'https://github.com/a/b' },
      { label: 'Site no ar', url: 'https://site.com' },
      { label: 'Protótipo', url: 'https://figma.com/x' },
      { label: 'Vídeo', url: 'https://youtu.be/x' },
      { label: 'Sem endereço' },
    ])
    expect(result).toEqual({
      repositoryUrl: 'https://github.com/a/b',
      liveUrl: 'https://site.com',
      prototypeUrl: 'https://figma.com/x',
      extraLinks: [{ title: 'Vídeo', url: 'https://youtu.be/x' }],
    })
  })

  it('reconstrói a lista de links na ordem esperada', () => {
    const links = buildProjectLinks({
      repositoryUrl: null,
      liveUrl: 'https://site.com',
      prototypeUrl: 'https://figma.com/x',
      extraLinks: [{ title: 'Vídeo', url: 'https://youtu.be/x' }],
    })
    expect(links.map((link) => link.label)).toEqual(['Site no ar', 'Protótipo', 'Vídeo'])
  })

  it('monta os grupos de tecnologia apenas com listas preenchidas', () => {
    expect(buildTechnologyGroups([], ['React']).map((group) => group.title)).toEqual([
      'Tecnologias & Ferramentas',
    ])
    expect(buildTechnologyGroups([], [])).toEqual([])
  })
})
