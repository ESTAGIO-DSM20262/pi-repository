import type { Role } from '@/domain/enterprise/entities/role'

export interface RoleAbility {
  icon: string
  title: string
  text: string
  where?: string
}

export interface RoleGuide {
  label: string
  headline: string
  intro: string
  abilities: RoleAbility[]
  flow: string[]
  limits: string[]
}

export type MatrixRole = 'visitor' | Role
export type AccessLevel = 'yes' | 'partial' | 'no'

export interface MatrixCell {
  level: AccessLevel
  note?: string
}

export interface MatrixRow {
  ability: string
  cells: Record<MatrixRole, MatrixCell>
}

export interface MatrixGroup {
  title: string
  rows: MatrixRow[]
}

export interface AccessibilityFeature {
  icon: string
  title: string
  text: string
}

function yes(note?: string): MatrixCell {
  return { level: 'yes', ...(note ? { note } : {}) }
}

function partial(note: string): MatrixCell {
  return { level: 'partial', note }
}

function no(note?: string): MatrixCell {
  return { level: 'no', ...(note ? { note } : {}) }
}

export const MATRIX_ROLES: { id: MatrixRole; label: string }[] = [
  { id: 'visitor', label: 'Visitante' },
  { id: 'student', label: 'Aluno' },
  { id: 'professor', label: 'Professor' },
  { id: 'admin', label: 'Administrador' },
]

export const PERMISSION_MATRIX: MatrixGroup[] = [
  {
    title: 'Consulta ao acervo',
    rows: [
      {
        ability: 'Pesquisar e consultar os projetos ativos (concluídos e em andamento)',
        cells: { visitor: yes(), student: yes(), professor: yes(), admin: yes() },
      },
      {
        ability: 'Ver projetos desativados',
        cells: {
          visitor: no(),
          student: no(),
          professor: partial('Só os que orienta'),
          admin: yes(),
        },
      },
      {
        ability: 'Favoritar projetos concluídos',
        cells: {
          visitor: no('É preciso entrar'),
          student: yes(),
          professor: yes(),
          admin: yes(),
        },
      },
    ],
  },
  {
    title: 'Projetos',
    rows: [
      {
        ability: 'Cadastrar projetos',
        cells: {
          visitor: no(),
          student: no(),
          professor: yes('Como orientador principal'),
          admin: yes('Escolhendo o orientador principal'),
        },
      },
      {
        ability: 'Editar dados, equipe e tecnologias, e concluir o projeto',
        cells: {
          visitor: no(),
          student: no(),
          professor: yes('Nos projetos ativos que orienta'),
          admin: no(),
        },
      },
      {
        ability: 'Alterar orientadores e links do projeto',
        cells: {
          visitor: no(),
          student: no(),
          professor: partial('Orientadores adicionais; não troca o principal'),
          admin: yes('Inclusive o orientador principal'),
        },
      },
      {
        ability: 'Desativar e reativar projetos',
        cells: {
          visitor: no(),
          student: no(),
          professor: partial('Só o orientador principal'),
          admin: yes(),
        },
      },
      {
        ability: 'Excluir projetos',
        cells: {
          visitor: no(),
          student: no(),
          professor: no(),
          admin: yes('Só projetos desativados'),
        },
      },
    ],
  },
  {
    title: 'Cronograma',
    rows: [
      {
        ability: 'Acompanhar tarefas e prazos',
        cells: {
          visitor: no(),
          student: yes('Do seu projeto, só para consulta'),
          professor: yes('Dos projetos que orienta'),
          admin: yes('De todos os projetos'),
        },
      },
      {
        ability: 'Criar tarefas',
        cells: {
          visitor: no(),
          student: no(),
          professor: yes('Em projetos em andamento que orienta'),
          admin: yes('Em projetos em andamento'),
        },
      },
      {
        ability: 'Editar tarefas',
        cells: {
          visitor: no(),
          student: no(),
          professor: partial('Só as que ele mesmo criou'),
          admin: yes('Qualquer tarefa'),
        },
      },
    ],
  },
  {
    title: 'Indicação e destaque',
    rows: [
      {
        ability: 'Indicar um PI concluído como referência',
        cells: {
          visitor: no(),
          student: no(),
          professor: yes('Orientadores do projeto'),
          admin: no('Só os orientadores indicam'),
        },
      },
      {
        ability: 'Escolher o Melhor PI do semestre',
        cells: {
          visitor: no(),
          student: no(),
          professor: partial('Só o orientador principal, nos seus projetos'),
          admin: yes('Qualquer projeto elegível'),
        },
      },
    ],
  },
  {
    title: 'Painel e administração',
    rows: [
      {
        ability: 'Painel com indicadores e filtros',
        cells: {
          visitor: no(),
          student: yes('Sobre o seu PI'),
          professor: yes('Sobre os projetos que orienta'),
          admin: yes('Visão institucional'),
        },
      },
      {
        ability: 'Cadastrar e importar usuários',
        cells: { visitor: no(), student: no(), professor: no(), admin: yes() },
      },
      {
        ability: 'Editar usuários e ativar ou desativar contas',
        cells: {
          visitor: no(),
          student: no(),
          professor: no(),
          admin: yes('Menos a própria conta'),
        },
      },
      {
        ability: 'Gerenciar os cursos',
        cells: { visitor: no(), student: no(), professor: no(), admin: yes() },
      },
    ],
  },
  {
    title: 'Conta e acessibilidade',
    rows: [
      {
        ability: 'Cadastrar GitHub e LinkedIn e trocar a senha no perfil',
        cells: {
          visitor: no(),
          student: yes(),
          professor: yes(),
          admin: yes('Também edita nome e e-mail'),
        },
      },
      {
        ability: 'Ajustes de acessibilidade e VLibras',
        cells: {
          visitor: yes('Sem precisar entrar'),
          student: yes(),
          professor: yes(),
          admin: yes(),
        },
      },
    ],
  },
]

export const ACCESSIBILITY_FEATURES: AccessibilityFeature[] = [
  {
    icon: 'fi-rr-text-size',
    title: 'Tamanho do texto',
    text: 'Aumente ou diminua as letras de todo o sistema, de 100% a 200%.',
  },
  {
    icon: 'fi-rr-palette',
    title: 'Tema escuro e alto contraste',
    text: 'Troque as cores por um tema escuro ou por cores fortes com bordas definidas.',
  },
  {
    icon: 'fi-rr-eye',
    title: 'Cores para daltonismo',
    text: 'Escolha um dos modos de daltonismo, os mesmos do site da Fatec.',
  },
  {
    icon: 'fi-rr-keyboard',
    title: 'Leitura e navegação',
    text: 'Sublinhe links, reduza animações e destaque o foco do teclado. Os atalhos do início da página levam direto ao conteúdo, ao menu e à busca.',
  },
  {
    icon: 'fi-rr-universal-access',
    title: 'VLibras',
    text: 'O tradutor de Língua Brasileira de Sinais do governo federal fica disponível em todas as páginas.',
  },
]

export const ROLE_GUIDES: Record<Role, RoleGuide> = {
  student: {
    label: 'Aluno',
    headline: 'Descubra referências e acompanhe o seu PI',
    intro:
      'Como aluno, você usa o acervo para se inspirar em projetos de semestres anteriores e para acompanhar o andamento do PI do qual participa.',
    abilities: [
      {
        icon: 'fi-rr-search',
        title: 'Explorar o acervo',
        text: 'Pesquise, filtre e ordene projetos concluídos e em andamento por tema, tecnologia, semestre letivo, semestre do curso e orientador. A opção Meus projetos mostra só os PIs de que você participa.',
        where: 'Página inicial',
      },
      {
        icon: 'fi-rr-star',
        title: 'Favoritar projetos',
        text: 'Marque com a estrela os projetos concluídos que quer consultar depois, como exemplos de documentação e arquitetura. Eles ficam reunidos na seção de favoritos do seu painel.',
        where: 'Estrela nos cartões e nas páginas dos projetos',
      },
      {
        icon: 'fi-rr-list-check',
        title: 'Acompanhar o seu PI',
        text: 'Veja as tarefas da equipe e as atribuídas a você, com prazos e andamento. Tarefas atribuídas a outros integrantes não aparecem. Você consulta o cronograma, mas quem o altera é o professor.',
        where: 'Página do projeto',
      },
      {
        icon: 'fi-rr-chart-histogram',
        title: 'Consultar o seu painel',
        text: 'Veja suas tarefas em aberto, atrasadas e as que vencem em 7 dias, o progresso do projeto da equipe, os próximos prazos e os seus favoritos.',
        where: 'Área do aluno',
      },
      {
        icon: 'fi-rr-user',
        title: 'Manter o seu perfil',
        text: 'Cadastre o GitHub e o LinkedIn, que aparecem na equipe dos projetos de que você participa, e troque a sua senha. Nome, e-mail, RA e curso são alterados pela administração.',
        where: 'Perfil',
      },
    ],
    flow: [
      'Entre com a conta institucional criada pela administração. Se esquecer a senha, use Esqueci minha senha na tela de login.',
      'Explore o acervo e favorite os projetos que servem de referência para o seu PI.',
      'Abra o projeto do seu grupo para acompanhar etapas e tarefas definidas pelo professor.',
      'Use o seu painel para reencontrar seus projetos, prazos e favoritos e mantenha o seu perfil atualizado.',
    ],
    limits: [
      'Cadastrar e editar projetos é feito pelo professor orientador.',
      'Criar ou alterar tarefas do cronograma é responsabilidade do professor orientador ou da administração.',
      'Indicar PIs, escolher o Melhor PI do semestre e administrar usuários e cursos não fazem parte do perfil de aluno.',
      'Projetos desativados não aparecem para alunos.',
    ],
  },
  professor: {
    label: 'Professor',
    headline: 'Oriente projetos e destaque as melhores referências',
    intro:
      'Como professor, você cadastra e orienta os PIs, acompanha o cronograma das equipes e indica os projetos que servem de referência.',
    abilities: [
      {
        icon: 'fi-rr-plus',
        title: 'Cadastrar projetos',
        text: 'Registre um novo PI com resumo, ciclo e semestre, tema, alunos, tecnologias, links dos artefatos e, se quiser, tarefas iniciais. Você entra como orientador principal e pode incluir até 4 orientadores adicionais.',
        where: 'Novo projeto',
      },
      {
        icon: 'fi-rr-edit',
        title: 'Editar os projetos que orienta',
        text: 'Qualquer orientador, principal ou adicional, atualiza dados, equipe, tecnologias e links, gerencia os orientadores adicionais e conclui o projeto quando estiver pronto. Projeto desativado só a administração edita.',
        where: 'Página do projeto',
      },
      {
        icon: 'fi-rr-list-check',
        title: 'Gerenciar o cronograma',
        text: 'Cadastre tarefas, para a equipe toda ou para um aluno e com prazo, nos projetos em andamento, e atualize as que você criou. Projetos concluídos ficam só para consulta.',
        where: 'Página do projeto em andamento',
      },
      {
        icon: 'fi-rr-shield-check',
        title: 'Indicar PIs',
        text: 'Marque os critérios que fazem de um projeto concluído uma referência. O selo Indicado só aparece quando todos os orientadores indicam. Você pode atualizar ou remover a sua indicação.',
        where: 'Painel de indicação na página do projeto',
      },
      {
        icon: 'fi-rr-trophy',
        title: 'Escolher o melhor PI do semestre',
        text: 'Se você é o orientador principal, escolha o melhor PI de cada ciclo e semestre do curso, com o apoio da sugestão do sistema, que conta os critérios atendidos. Só os melhores PIs de cada semestre seguem para a aba Projetos Integradores do site da Fatec Itaquera.',
        where: 'Painel do professor e página do projeto',
      },
      {
        icon: 'fi-rr-eye-crossed',
        title: 'Desativar e reativar projetos',
        text: 'O orientador principal pode desativar o projeto e reativá-lo depois. Projeto desativado sai da vista pública, continua visível para os orientadores com a etiqueta Desativado e perde a escolha de melhor PI. A exclusão definitiva é só do administrador.',
        where: 'Página do projeto',
      },
      {
        icon: 'fi-rr-chart-histogram',
        title: 'Acompanhar pelo painel',
        text: 'Veja tarefas atrasadas e a vencer, projetos parados ou sem tarefas, os prontos para concluir, a carga de cada aluno e os concluídos que você ainda não indicou. Filtre por semestre, situação e projeto e pesquise por título, aluno, tema ou ciclo.',
        where: 'Área do professor',
      },
      {
        icon: 'fi-rr-search',
        title: 'Explorar todo o acervo',
        text: 'Consulte qualquer projeto, inclusive de outros orientadores, e use a opção Sob minha orientação para ver só os seus.',
        where: 'Página inicial',
      },
      {
        icon: 'fi-rr-star',
        title: 'Favoritar projetos',
        text: 'Marque com a estrela os projetos concluídos que quer guardar como referência. Eles ficam reunidos na seção de favoritos do seu painel.',
        where: 'Estrela nos cartões e nas páginas dos projetos',
      },
      {
        icon: 'fi-rr-user',
        title: 'Manter o seu perfil',
        text: 'Cadastre o GitHub e o LinkedIn, que aparecem como orientador nos projetos, e troque a sua senha. Nome, e-mail e matrícula são alterados pela administração.',
        where: 'Perfil',
      },
    ],
    flow: [
      'Entre com a conta institucional criada pela administração. Se esquecer a senha, use Esqueci minha senha na tela de login.',
      'Cadastre o PI da turma e informe os alunos e os co-orientadores, se houver.',
      'Crie as tarefas do cronograma e acompanhe o andamento no seu painel.',
      'Ao finalizar, conclua o projeto e indique-o como referência junto com os demais orientadores. Sendo o orientador principal, escolha o Melhor PI do semestre.',
    ],
    limits: [
      'Você edita apenas os projetos que orienta ou co-orienta, e só enquanto estão ativos.',
      'Você altera somente as tarefas do cronograma que você mesmo criou.',
      'Desativar, reativar e escolher o Melhor PI do semestre cabem ao orientador principal. Co-orientadores indicam critérios, mas não decidem.',
      'Cadastrar usuários, gerenciar cursos e excluir projetos é função da administração.',
    ],
  },
  admin: {
    label: 'Administrador',
    headline: 'Cuide dos usuários, dos cursos, dos projetos e da visão geral',
    intro:
      'Como administrador, você mantém o acervo organizado: gerencia quem tem acesso, os cursos, supervisiona os projetos e acompanha os números da instituição.',
    abilities: [
      {
        icon: 'fi-rr-user-add',
        title: 'Cadastrar usuários',
        text: 'Crie contas de alunos, professores e administradores, uma a uma ou importando a planilha do SIGA, com até 500 registros por vez. E-mails que já existem são ignorados. Cada conta nova recebe uma senha temporária, que você copia e entrega por um canal seguro.',
        where: 'Administração › Usuários',
      },
      {
        icon: 'fi-rr-users',
        title: 'Gerenciar contas',
        text: 'Pesquise por nome, RA ou e-mail, filtre por perfil e por situação (ativo ou inativo), edite nome, e-mail, perfil, RA e curso, e ative ou desative contas. Desativar uma conta encerra as sessões dela. Na lista, você não desativa a própria conta.',
        where: 'Painel do administrador › Usuários',
      },
      {
        icon: 'fi-rr-school',
        title: 'Gerenciar cursos',
        text: 'Cadastre cursos com nome e sigla, renomeie, ative ou desative. Só cursos ativos podem ser atribuídos aos usuários. Um curso com usuários vinculados pode ser desativado, mas não excluído.',
        where: 'Painel do administrador › Cursos',
      },
      {
        icon: 'fi-rr-edit',
        title: 'Cadastrar projetos e ajustar orientadores',
        text: 'Cadastre projetos em nome de um professor orientador e, na edição de qualquer projeto, ajuste os orientadores, inclusive o principal, e os links. Dados, equipe e tecnologias ficam com os orientadores.',
        where: 'Novo projeto e página do projeto',
      },
      {
        icon: 'fi-rr-list-check',
        title: 'Gerenciar o cronograma',
        text: 'Crie e edite qualquer tarefa dos projetos em andamento, inclusive as criadas por professores.',
        where: 'Página do projeto em andamento',
      },
      {
        icon: 'fi-rr-eye-crossed',
        title: 'Ativar, desativar e excluir projetos',
        text: 'Retire um projeto da vista pública sem apagá-lo ou devolva-o ao acervo. Projetos desativados só aparecem para você e para os orientadores. A exclusão definitiva só vale para projetos desativados.',
        where: 'Controles na página do projeto',
      },
      {
        icon: 'fi-rr-trophy',
        title: 'Melhor PI do semestre',
        text: 'Escolha o melhor PI de cada ciclo e semestre do curso, com o apoio da sugestão do sistema. Só os melhores PIs de cada semestre seguem para a aba Projetos Integradores do site da Fatec Itaquera.',
        where: 'Painel do administrador e página do projeto',
      },
      {
        icon: 'fi-rr-star',
        title: 'Favoritar projetos',
        text: 'Marque com a estrela os projetos concluídos que quer guardar como referência. Eles ficam reunidos na seção de favoritos do seu painel.',
        where: 'Estrela nos cartões e nas páginas dos projetos',
      },
      {
        icon: 'fi-rr-chart-pie-alt',
        title: 'Painel institucional',
        text: 'Acompanhe projetos por situação e semestre, tarefas, pendências, carga dos orientadores e cadastros de usuários, com filtros por semestre, situação, orientador e projeto.',
        where: 'Área do administrador',
      },
    ],
    flow: [
      'Cadastre ou importe os usuários do semestre, mantenha os cursos em dia e confira se as contas estão ativas.',
      'Acompanhe pelo painel institucional os projetos em andamento, atrasos e concluídos.',
      'Dê suporte aos professores: ajuste orientadores e links, gerencie tarefas e corrija cadastros de usuários.',
      'Mantenha o acervo organizado, desativando o que não deve aparecer publicamente, e escolha o Melhor PI de cada semestre.',
    ],
    limits: [
      'A indicação de PIs como referência técnica é feita só pelos professores orientadores.',
      'Dados, equipe e tecnologias de um projeto são editados pelos orientadores. Você ajusta os orientadores e os links.',
      'Na lista de usuários, você não desativa a própria conta nem altera o seu próprio perfil ou e-mail. Peça a outro administrador.',
    ],
  },
}
