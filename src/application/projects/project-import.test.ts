import { describe, expect, it } from 'vitest'
import { parseProjectGrid } from './project-import'

const HEADER = [
  'Título do projeto *',
  'Resumo *',
  'Descrição detalhada',
  'Ciclo *',
  'Semestre *',
  'Tema *',
  'Situação',
  'Orientador principal',
  'Orientadores adicionais',
  'E-mails dos alunos *',
  'Líder do grupo',
  'Linguagens',
  'Tecnologias e ferramentas',
  'Repositório',
  'Site no ar',
  'Protótipo',
  'Vídeo do projeto',
]

function row(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    'Título do projeto *': 'Gestão de Laboratórios',
    'Resumo *': 'Sistema para agendar laboratórios da faculdade.',
    'Descrição detalhada': '',
    'Ciclo *': '2026/2',
    'Semestre *': '3',
    'Tema *': 'Gestão',
    Situação: '',
    'Orientador principal': '',
    'Orientadores adicionais': '',
    'E-mails dos alunos *': 'a@aluno.cps.sp.gov.br',
    'Líder do grupo': '',
    Linguagens: '',
    'Tecnologias e ferramentas': '',
    Repositório: '',
    'Site no ar': '',
    Protótipo: '',
    'Vídeo do projeto': '',
    ...overrides,
  }
  return HEADER.map((column) => values[column] ?? '')
}

describe('parseProjectGrid', () => {
  it('ignora abas que não têm as colunas Título e Resumo', () => {
    expect(parseProjectGrid([['Como preencher'], ['Passo 1']], 'Instruções')).toBeNull()
    expect(parseProjectGrid([], 'Vazia')).toBeNull()
  })

  it('lê uma linha completa, normalizando listas, ciclo, semestre e situação', () => {
    const grid = [
      HEADER,
      row({
        'Ciclo *': '2026-2',
        'Semestre *': '4º semestre',
        Situação: 'Concluído',
        'Orientador principal': ' Prof@CPS.sp.gov.br ',
        'Orientadores adicionais': 'x@cps.sp.gov.br; y@cps.sp.gov.br',
        'E-mails dos alunos *':
          'A@aluno.cps.sp.gov.br, b@aluno.cps.sp.gov.br\nA@aluno.cps.sp.gov.br',
        'Líder do grupo': 'B@aluno.cps.sp.gov.br',
        Linguagens: 'TypeScript, Python',
        'Tecnologias e ferramentas': 'React; Node.js',
      }),
    ]

    const parsed = parseProjectGrid(grid, 'Projetos')

    expect(parsed?.errors).toEqual([])
    expect(parsed?.rows).toHaveLength(1)
    expect(parsed?.rows[0]).toMatchObject({
      sheet: 'Projetos',
      rowNumber: 2,
      title: 'Gestão de Laboratórios',
      cycle: '2026/2',
      semester: 4,
      status: 'publicado',
      advisorEmail: 'prof@cps.sp.gov.br',
      coAdvisorEmails: ['x@cps.sp.gov.br', 'y@cps.sp.gov.br'],
      studentEmails: ['a@aluno.cps.sp.gov.br', 'b@aluno.cps.sp.gov.br'],
      leaderEmail: 'b@aluno.cps.sp.gov.br',
      languages: ['TypeScript', 'Python'],
      stack: ['React', 'Node.js'],
    })
  })

  it('considera em andamento quando a situação está em branco', () => {
    const parsed = parseProjectGrid([HEADER, row()], 'Projetos')

    expect(parsed?.rows[0]?.status).toBe('em_andamento')
  })

  it('monta os links com os ícones padrão e completa o https', () => {
    const parsed = parseProjectGrid(
      [
        HEADER,
        row({
          Repositório: 'github.com/fatec/pi',
          'Site no ar': 'https://pi.fatec.edu.br',
          'Vídeo do projeto': 'https://youtu.be/abc',
        }),
      ],
      'Projetos',
    )

    expect(parsed?.rows[0]?.links).toEqual([
      { title: 'Repositório', url: 'https://github.com/fatec/pi', icon: 'fi-rr-code-branch' },
      { title: 'Site no ar', url: 'https://pi.fatec.edu.br', icon: 'fi-rr-globe' },
      { title: 'Vídeo de apresentação', url: 'https://youtu.be/abc', icon: 'fi-rr-play-circle' },
    ])
  })

  it('registra erro de linha para semestre ou situação inválidos e segue as demais', () => {
    const parsed = parseProjectGrid(
      [
        HEADER,
        row({ 'Semestre *': '9' }),
        row({ Situação: 'talvez' }),
        row({ 'Título do projeto *': 'Outro' }),
      ],
      'Projetos',
    )

    expect(parsed?.rows.map((item) => item.title)).toEqual(['Outro'])
    expect(parsed?.errors).toEqual([
      {
        sheet: 'Projetos',
        rowNumber: 2,
        title: 'Gestão de Laboratórios',
        reason: 'Semestre inválido. Informe um número de 1 a 6.',
      },
      {
        sheet: 'Projetos',
        rowNumber: 3,
        title: 'Gestão de Laboratórios',
        reason: 'Situação inválida. Use “Em andamento” ou “Concluído”.',
      },
    ])
  })

  it('pula linhas totalmente em branco mantendo a numeração real', () => {
    const blank = HEADER.map(() => '')
    const parsed = parseProjectGrid([HEADER, blank, row()], 'Projetos')

    expect(parsed?.rows).toHaveLength(1)
    expect(parsed?.rows[0]?.rowNumber).toBe(3)
  })
})
