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
        text: 'Pesquise e filtre projetos concluídos e em andamento por tema, tecnologia, semestre e orientador.',
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
        text: 'Veja o cronograma e as tarefas dos projetos em que você é integrante, cadastradas pelo professor orientador.',
        where: 'Página do projeto',
      },
      {
        icon: 'fi-rr-chart-histogram',
        title: 'Consultar o seu painel',
        text: 'Reúna em um só lugar os projetos de que você participa e os seus favoritos.',
        where: 'Área do aluno',
      },
      {
        icon: 'fi-rr-user',
        title: 'Manter o seu perfil',
        text: 'Atualize seus dados, GitHub e LinkedIn. Os links aparecem na equipe dos projetos de que você participa.',
        where: 'Perfil',
      },
    ],
    flow: [
      'Entre com a sua conta institucional.',
      'Explore o acervo e favorite os projetos que servem de referência para o seu PI.',
      'Abra o projeto do seu grupo para acompanhar etapas e tarefas definidas pelo professor.',
      'Use o seu painel para reencontrar seus projetos e favoritos e mantenha o seu perfil atualizado.',
    ],
    limits: [
      'Cadastrar e editar projetos é feito pelo professor orientador.',
      'Criar ou alterar tarefas do cronograma é responsabilidade do professor.',
      'Indicar PIs como referência e administrar usuários não fazem parte do perfil de aluno.',
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
        text: 'Registre um novo PI com resumo, equipe, tecnologias, links, imagens e artefatos.',
        where: 'Novo projeto',
      },
      {
        icon: 'fi-rr-edit',
        title: 'Editar os projetos que orienta',
        text: 'Atualize as informações dos PIs em que você é orientador ou co-orientador e conclua o projeto quando estiver pronto.',
        where: 'Página do projeto',
      },
      {
        icon: 'fi-rr-list-check',
        title: 'Gerenciar o cronograma',
        text: 'Cadastre as tarefas dos projetos em andamento e atualize as que você criou, para a equipe acompanhar cada etapa.',
        where: 'Página do projeto em andamento',
      },
      {
        icon: 'fi-rr-shield-check',
        title: 'Indicar PIs',
        text: 'Revise projetos concluídos e indique os que merecem ser referência técnica. Você também pode remover a sua própria indicação.',
        where: 'Painel de indicação na página do projeto',
      },
      {
        icon: 'fi-rr-chart-histogram',
        title: 'Acompanhar pelo painel',
        text: 'Veja tarefas atrasadas, projetos parados ou sem tarefas e os que estão prontos para concluir, com filtros por semestre, situação e projeto.',
        where: 'Área do professor',
      },
      {
        icon: 'fi-rr-search',
        title: 'Explorar todo o acervo',
        text: 'Consulte qualquer projeto, inclusive de outros orientadores, e use a opção de ver só os que estão sob a sua orientação.',
        where: 'Página inicial',
      },
      {
        icon: 'fi-rr-star',
        title: 'Favoritar projetos',
        text: 'Marque com a estrela os projetos concluídos que quer guardar como referência. Eles ficam reunidos na seção de favoritos do seu painel.',
        where: 'Estrela nos cartões e nas páginas dos projetos',
      },
    ],
    flow: [
      'Entre com a sua conta institucional.',
      'Cadastre o PI da turma e informe a equipe e os co-orientadores, se houver.',
      'Crie as tarefas do cronograma e acompanhe o andamento no seu painel.',
      'Ao finalizar, conclua o projeto e, se ele for exemplar, indique-o como referência.',
    ],
    limits: [
      'Você edita apenas os projetos que orienta ou co-orienta.',
      'Você altera somente as tarefas do cronograma que você mesmo criou.',
      'Cadastrar usuários e ativar ou desativar projetos é função da administração.',
    ],
  },
  admin: {
    label: 'Administrador',
    headline: 'Cuide dos usuários, dos projetos e da visão geral',
    intro:
      'Como administrador, você mantém o acervo organizado: gerencia quem tem acesso, supervisiona os projetos e acompanha os números da instituição.',
    abilities: [
      {
        icon: 'fi-rr-user-add',
        title: 'Cadastrar usuários',
        text: 'Crie contas de alunos, professores e administradores, uma a uma ou em lote, importando uma planilha.',
        where: 'Administração › Usuários',
      },
      {
        icon: 'fi-rr-users',
        title: 'Gerenciar contas',
        text: 'Consulte a lista de usuários e ative ou desative contas quando necessário.',
        where: 'Administração › Usuários',
      },
      {
        icon: 'fi-rr-eye-crossed',
        title: 'Ativar e desativar projetos',
        text: 'Retire um projeto da vista pública sem apagá-lo, ou devolva-o ao acervo. Projetos desativados só aparecem para você.',
        where: 'Controles na página do projeto',
      },
      {
        icon: 'fi-rr-edit',
        title: 'Editar qualquer projeto',
        text: 'Corrija informações, gerencie o cronograma e cadastre projetos em nome dos orientadores.',
        where: 'Página do projeto e novo projeto',
      },
      {
        icon: 'fi-rr-shield-check',
        title: 'Indicar PIs',
        text: 'Indique projetos concluídos como referência técnica, assim como os professores orientadores.',
        where: 'Painel de indicação na página do projeto',
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
        text: 'Acompanhe projetos por situação e semestre, tarefas, cadastros de usuários e orientadores, com filtros por semestre, situação, orientador e projeto.',
        where: 'Área do administrador',
      },
    ],
    flow: [
      'Cadastre ou importe os usuários do semestre e confira se as contas estão ativas.',
      'Acompanhe pelo painel institucional os projetos em andamento, atrasos e concluídos.',
      'Dê suporte aos professores: edite projetos, ajuste cadastros e indique referências.',
      'Mantenha o acervo organizado, desativando o que não deve aparecer publicamente.',
    ],
    limits: [],
  },
}
