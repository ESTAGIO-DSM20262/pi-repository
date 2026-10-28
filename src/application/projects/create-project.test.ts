import { describe, expect, it } from 'vitest'
import { parseCreateProjectInput } from './create-project'

const valid = {
  title: 'Projeto Teste',
  summary: 'Resumo suficientemente longo do projeto.',
  overview: '',
  cycle: '2026/2',
  semester: 3,
  theme: 'Educação',
  advisorEmail: 'Prof@cps.sp.gov.br',
  studentEmails: ['a@aluno.cps.sp.gov.br', 'A@aluno.cps.sp.gov.br'],
  languages: ['TypeScript', 'typescript'],
  stack: ['React'],
  tasks: [],
}

describe('parseCreateProjectInput', () => {
  it('aceita um projeto sem tarefas e normaliza os dados', () => {
    const result = parseCreateProjectInput(valid)
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tasks).toEqual([])
      expect(result.value.advisorEmail).toBe('prof@cps.sp.gov.br')
      expect(result.value.studentEmails).toEqual(['a@aluno.cps.sp.gov.br'])
      expect(result.value.languages).toEqual(['TypeScript'])
      expect(result.value.status).toBe('em_andamento')
    }
  })

  it('aceita um projeto com tarefa inicial atribuída a um aluno do projeto', () => {
    const result = parseCreateProjectInput({
      ...valid,
      tasks: [
        {
          title: 'Levantar requisitos',
          description: 'Documentar os requisitos.',
          targetStudentEmail: 'a@aluno.cps.sp.gov.br',
          dueDate: '2026-11-30',
        },
      ],
    })
    expect(result.isRight()).toBe(true)
  })

  it('salva função opcional e líder para os integrantes selecionados', () => {
    const result = parseCreateProjectInput({
      ...valid,
      teamAssignments: [
        {
          studentEmail: 'a@aluno.cps.sp.gov.br',
          roleTitle: 'Desenvolvimento Front-end',
          isLeader: true,
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.teamAssignments).toEqual([
        {
          studentEmail: 'a@aluno.cps.sp.gov.br',
          roleTitle: 'Desenvolvimento Front-end',
          isLeader: true,
        },
      ])
    }
  })

  it('rejeita mais de um líder e uma função acima do limite', () => {
    expect(
      parseCreateProjectInput({
        ...valid,
        studentEmails: ['a@aluno.cps.sp.gov.br', 'b@aluno.cps.sp.gov.br'],
        teamAssignments: [
          { studentEmail: 'a@aluno.cps.sp.gov.br', isLeader: true },
          { studentEmail: 'b@aluno.cps.sp.gov.br', isLeader: true },
        ],
      }).isLeft(),
    ).toBe(true)

    expect(
      parseCreateProjectInput({
        ...valid,
        teamAssignments: [{ studentEmail: 'a@aluno.cps.sp.gov.br', roleTitle: 'F'.repeat(41) }],
      }).isLeft(),
    ).toBe(true)
  })

  it('rejeita prazos com datas inexistentes no calendário', () => {
    const result = parseCreateProjectInput({
      ...valid,
      tasks: [
        {
          title: 'Entregar documentação',
          description: 'Preparar e revisar a documentação técnica.',
          targetStudentEmail: 'a@aluno.cps.sp.gov.br',
          dueDate: '2026-02-31',
        },
      ],
    })

    expect(result.isLeft()).toBe(true)
  })

  it('rejeita responsável que não pertence ao projeto', () => {
    const result = parseCreateProjectInput({
      ...valid,
      tasks: [
        {
          title: 'Tarefa',
          description: 'Descrição válida',
          targetStudentEmail: 'outro@aluno.cps.sp.gov.br',
        },
      ],
    })
    expect(result.isLeft()).toBe(true)
  })

  it('exige ao menos um aluno e ciclo válido', () => {
    expect(parseCreateProjectInput({ ...valid, studentEmails: [] }).isLeft()).toBe(true)
    expect(parseCreateProjectInput({ ...valid, cycle: '2026' }).isLeft()).toBe(true)
  })

  it('aceita links personalizados com título, endereço HTTPS e ícone do catálogo', () => {
    const result = parseCreateProjectInput({
      ...valid,
      links: [
        { title: 'Repositório', url: 'https://github.com/org/projeto', icon: 'fi-rr-code-branch' },
        { title: 'Vídeo de apresentação', url: 'https://youtu.be/abc', icon: 'fi-rr-play-circle' },
        { title: '', url: '', icon: '' },
      ],
    })
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.links).toEqual([
        { title: 'Repositório', url: 'https://github.com/org/projeto', icon: 'fi-rr-code-branch' },
        { title: 'Vídeo de apresentação', url: 'https://youtu.be/abc', icon: 'fi-rr-play-circle' },
      ])
    }
  })

  it('troca um ícone fora do catálogo pelo ícone padrão de link', () => {
    const result = parseCreateProjectInput({
      ...valid,
      links: [{ title: 'Site', url: 'https://site.com', icon: 'fi-rr-malicious" onclick="x' }],
    })
    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect(result.value.links[0].icon).toBe('fi-rr-link')
  })

  it('rejeita links sem HTTPS, sem título ou acima do limite', () => {
    expect(
      parseCreateProjectInput({
        ...valid,
        links: [{ title: 'Site', url: 'http://site.com', icon: 'fi-rr-globe' }],
      }).isLeft(),
    ).toBe(true)
    expect(
      parseCreateProjectInput({
        ...valid,
        links: [{ title: '', url: 'https://site.com', icon: 'fi-rr-globe' }],
      }).isLeft(),
    ).toBe(true)
    const many = Array.from({ length: 13 }, (_, index) => ({
      title: `Link ${index + 1}`,
      url: `https://site.com/${index}`,
      icon: 'fi-rr-link',
    }))
    expect(parseCreateProjectInput({ ...valid, links: many }).isLeft()).toBe(true)
  })

  it('padroniza o nome das tecnologias pelo catálogo e mantém as desconhecidas', () => {
    const result = parseCreateProjectInput({
      ...valid,
      languages: ['js', 'TYPESCRIPT', 'Linguagem Inventada'],
      stack: ['nodejs', 'Node.js', 'next', 'postgres', 'Ferramenta Interna'],
    })
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.languages).toEqual(['JavaScript', 'TypeScript', 'Linguagem Inventada'])
      expect(result.value.stack).toEqual(['Node.js', 'Next.js', 'PostgreSQL', 'Ferramenta Interna'])
    }
  })

  it('aceita professores orientadores adicionais sem repetir o principal', () => {
    const result = parseCreateProjectInput({
      ...valid,
      coAdvisorEmails: ['Satelite@cps.sp.gov.br', 'prof@cps.sp.gov.br', 'satelite@cps.sp.gov.br'],
    })
    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect(result.value.coAdvisorEmails).toEqual(['satelite@cps.sp.gov.br'])
  })

  it('limita o total de professores orientadores a cinco', () => {
    const result = parseCreateProjectInput({
      ...valid,
      coAdvisorEmails: Array.from({ length: 5 }, (_, index) => `prof${index}@cps.sp.gov.br`),
    })
    expect(result.isLeft()).toBe(true)
  })

  it('aceita imagens com orientação e rejeita orientação inválida ou URL sem HTTPS', () => {
    const image = { title: 'Tela inicial', url: 'https://cdn.exemplo.com/a.png' }
    const ok = parseCreateProjectInput({
      ...valid,
      images: [
        { ...image, orientation: 'vertical' },
        { ...image, url: 'https://cdn.exemplo.com/b.png', orientation: 'horizontal' },
      ],
    })
    expect(ok.isRight()).toBe(true)
    if (ok.isRight())
      expect(ok.value.images?.map((item) => item.orientation)).toEqual(['vertical', 'horizontal'])

    expect(
      parseCreateProjectInput({
        ...valid,
        images: [{ ...image, orientation: 'quadrada' }],
      }).isLeft(),
    ).toBe(true)
    expect(
      parseCreateProjectInput({
        ...valid,
        images: [{ ...image, url: 'http://x.com/a.png', orientation: 'vertical' }],
      }).isLeft(),
    ).toBe(true)
  })

  it('mantém as imagens existentes quando o corpo não envia a lista', () => {
    const result = parseCreateProjectInput(valid)
    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect(result.value.images).toBeUndefined()
  })
})
