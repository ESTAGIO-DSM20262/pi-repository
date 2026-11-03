import { describe, expect, it } from 'vitest'
import {
  canonicalTechnologyName,
  findCatalogTechnology,
  normalizeTechnologyList,
  popularTechnologies,
  suggestTechnologies,
  TECHNOLOGY_CATALOG,
  technologyKey,
} from './technology-catalog'

describe('technologyKey', () => {
  it('ignora caixa, acentos, espaços, pontos e hífens, mas preserva + e #', () => {
    expect(technologyKey('Node.js')).toBe(technologyKey('node js'))
    expect(technologyKey(' Vue-JS ')).toBe('vuejs')
    expect(technologyKey('C++')).toBe('c++')
    expect(technologyKey('C#')).toBe('c#')
    expect(technologyKey('Configuração')).toBe('configuracao')
  })
})

describe('canonicalTechnologyName', () => {
  it.each([
    ['js', 'JavaScript'],
    ['TYPESCRIPT', 'TypeScript'],
    ['nodejs', 'Node.js'],
    ['node', 'Node.js'],
    ['next', 'Next.js'],
    ['postgres', 'PostgreSQL'],
    ['springboot', 'Spring Boot'],
    ['golang', 'Go'],
    ['csharp', 'C#'],
    ['k8s', 'Kubernetes'],
    ['dotnet', '.NET'],
  ])('padroniza %s para %s', (typed, expected) => {
    expect(canonicalTechnologyName(typed)).toBe(expected)
  })

  it('mantém o nome digitado quando a tecnologia não está no catálogo', () => {
    expect(canonicalTechnologyName('  Minha   Ferramenta  ')).toBe('Minha Ferramenta')
  })

  it('limita o tamanho do nome e devolve vazio para entrada em branco', () => {
    expect(canonicalTechnologyName('x'.repeat(100))).toHaveLength(60)
    expect(canonicalTechnologyName('   ')).toBe('')
  })
})

describe('normalizeTechnologyList', () => {
  it('remove duplicadas mesmo escritas de formas diferentes e respeita o limite', () => {
    expect(normalizeTechnologyList(['react', 'React', 'reactjs', 'Vue', 'vuejs'], 10)).toEqual([
      'React',
      'Vue.js',
    ])
    expect(normalizeTechnologyList(['a1', 'b2', 'c3'], 2)).toEqual(['a1', 'b2'])
  })
})

describe('suggestTechnologies', () => {
  it('sugere pelo início do nome ou do apelido antes de sugerir por trecho', () => {
    const names = suggestTechnologies('java', 'language', []).map((entry) => entry.name)
    expect(names[0]).toBe('Java')
    expect(names).toContain('JavaScript')
  })

  it('não sugere o que já foi selecionado e respeita o tipo (linguagem x ferramenta)', () => {
    const languages = suggestTechnologies('', 'language', ['Python'], 30).map((entry) => entry.name)
    expect(languages).not.toContain('Python')
    expect(languages).not.toContain('React')

    const tools = suggestTechnologies('react', 'tool', [])
    expect(tools.map((entry) => entry.name)).toContain('React')
  })

  it('aceita apelidos na busca', () => {
    expect(suggestTechnologies('postgres', 'tool', [])[0].name).toBe('PostgreSQL')
  })

  it('oferece uma lista de populares do tipo pedido', () => {
    const popular = popularTechnologies('tool', [], 6)
    expect(popular).toHaveLength(6)
    expect(popular.every((entry) => entry.kind === 'tool')).toBe(true)
  })
})

describe('catálogo', () => {
  it('não tem nomes nem apelidos ambíguos entre tecnologias diferentes', () => {
    const owner = new Map<string, string>()
    for (const entry of TECHNOLOGY_CATALOG) {
      for (const label of [entry.name, ...(entry.aliases ?? [])]) {
        const key = technologyKey(label)
        const current = owner.get(key)
        if (current && current !== entry.name) {
          throw new Error(`"${label}" aponta para ${current} e ${entry.name}`)
        }
        owner.set(key, entry.name)
      }
    }
    expect(findCatalogTechnology('react')?.name).toBe('React')
  })
})
