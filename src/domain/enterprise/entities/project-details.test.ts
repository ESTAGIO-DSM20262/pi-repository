import { describe, expect, it } from 'vitest'
import {
  buildProjectLinks,
  buildTechnologyGroups,
  DEFAULT_PROJECT_LINK_ICON,
  isProjectLinkIcon,
  PROJECT_LINK_ICONS,
  PROJECT_LINK_PRESETS,
  resolveProjectLinkIcon,
  toProjectLinkInputs,
} from './project-details'

describe('project-details', () => {
  it('converte os links salvos em campos de formulário, descartando os sem endereço', () => {
    const result = toProjectLinkInputs([
      { label: 'Repositório', url: 'https://github.com/a/b' },
      { label: 'Vídeo', url: 'https://youtu.be/x', icon: 'fi-rr-play-circle' },
      { label: 'Sem endereço' },
    ])
    expect(result).toEqual([
      { title: 'Repositório', url: 'https://github.com/a/b', icon: 'fi-rr-code-branch' },
      { title: 'Vídeo', url: 'https://youtu.be/x', icon: 'fi-rr-play-circle' },
    ])
  })

  it('reconstrói a lista de links preservando a ordem escolhida', () => {
    const links = buildProjectLinks([
      { title: 'Vídeo', url: 'https://youtu.be/x', icon: 'fi-rr-play-circle' },
      { title: 'Site no ar', url: 'https://site.com', icon: 'fi-rr-globe' },
    ])
    expect(links.map((link) => link.label)).toEqual(['Vídeo', 'Site no ar'])
    expect(links[0].icon).toBe('fi-rr-play-circle')
  })

  it('resolve o ícone pelo catálogo, depois pelo título conhecido, depois pelo padrão', () => {
    expect(resolveProjectLinkIcon({ label: 'Qualquer', icon: 'fi-rr-trophy' })).toBe('fi-rr-trophy')
    expect(resolveProjectLinkIcon({ label: 'site no ar' })).toBe('fi-rr-globe')
    expect(resolveProjectLinkIcon({ label: 'Algo novo', icon: 'fi-rr-inexistente' })).toBe(
      DEFAULT_PROJECT_LINK_ICON,
    )
  })

  it('mantém o catálogo consistente: ícones únicos e todos os modelos com ícone válido', () => {
    const icons = PROJECT_LINK_ICONS.map((option) => option.icon)
    expect(new Set(icons).size).toBe(icons.length)
    expect(PROJECT_LINK_PRESETS.every((preset) => isProjectLinkIcon(preset.icon))).toBe(true)
    expect(icons).toContain(DEFAULT_PROJECT_LINK_ICON)
  })

  it('monta os grupos de tecnologia apenas com listas preenchidas', () => {
    expect(buildTechnologyGroups([], ['React']).map((group) => group.title)).toEqual([
      'Tecnologias & Ferramentas',
    ])
    expect(buildTechnologyGroups([], [])).toEqual([])
  })
})
