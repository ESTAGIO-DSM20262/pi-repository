# Melhor PI do semestre

A branch `feat/acessibilidade` mantém as melhorias de acessibilidade e incorpora a main fornecida no ZIP, no commit `2540191`. O conflito no painel de indicações foi resolvido preservando a validação de formulário e a restauração de foco.

## Antes de usar

1. Instale as dependências com `npm ci` e configure as variáveis descritas em `.env.example`.
2. Rode `npm run db:migrate`. Depois das migrations do Drizzle, ele aplica automaticamente `src/db/migrations/20261105_semester_awards.sql`, que vem depois de `20261021_projects.sql` e `20261027_project_advisors_verification.sql` (esta última cria `projects.active`). O SQL é transacional e pode ser reaplicado, inclusive em bancos que já receberam a versão anterior: a restrição única criada com nome automático é renomeada para `semester_awards_project_unique`. Não apaga projetos nem indicações.
3. Inicie o sistema e acesse o painel como administrador ou orientador principal de um projeto.

Não há SQL manual a executar no banco. Nenhuma alteração foi aplicada ao banco remoto durante esta entrega.

## Como funciona

- A seção **Melhor PI do semestre** aparece no painel administrativo e no painel de professores que são orientadores principais. O professor escolhe primeiro o **ciclo** (por exemplo, 2026/2, o 2º semestre de 2026) e o **semestre do curso** (2º, 3º, 4º...) e vê apenas os projetos daquele grupo. Projetos demonstrativos não participam.
- No topo do grupo há dois quadros: **Escolha do professor** (o projeto escolhido, se houver) e **Sugestão do sistema** (o projeto com mais critérios atendidos).
- Cada projeto mostra "N de 7 critérios atendidos", uma barra de progresso e a lista dos 7 critérios, cada um marcado como atendido ou não atendido. Os "pontos" são exatamente esses critérios.
- Cada combinação de ciclo letivo e semestre do curso tem um único vencedor. Por exemplo, `2026/2 / 2º semestre` é uma seleção independente de `2026/2 / 3º semestre` e de `2025/2 / 2º semestre`.
- O administrador pode escolher qualquer projeto elegível. O professor pode escolher apenas os projetos em que consta como orientador principal. Participar como professor satélite não concede permissão de escolha nem de retirada.
- O detalhe do projeto também mostra a seção para o orientador principal e o administrador. Após alterar uma indicação, os pontos são recarregados junto com os dados da página.
- Cada um dos sete critérios distintos indicados vale um ponto. Repetições do mesmo critério não multiplicam a pontuação. São consideradas apenas as indicações de orientadores atualmente vinculados: o administrador não indica projetos, e registros antigos de indicação feitos por administradores são ignorados.
- A recomendação considera todos os projetos ativos e concluídos daquele ciclo e semestre, independentemente dos filtros da tela. Empates são exibidos como recomendações equivalentes. Sem pontos, não há recomendação automática.
- A decisão é manual: um projeto com menos critérios, ou até sem indicação, pode ser escolhido. Antes de escolher ou retirar, o pop-up de confirmação mostra os critérios do projeto, o que o sistema sugere e, se houver, a escolha que será substituída. O resultado aparece em um aviso de sucesso ou erro.
- O painel mostra um aviso explicando que só os melhores PIs de cada semestre seguem para o site da Fatec Itaquera, na aba Projetos Integradores. O mesmo lembrete aparece no pop-up de confirmação. A lista é sempre carregada atualizada, por isso não há botão de atualizar.
- O projeto escolhido recebe a etiqueta **Melhor PI escolhido** no card da página inicial e a etiqueta **Melhor PI de ciclo · semestre** na página do projeto.
- Uma escolha concorrente não é sobrescrita silenciosamente: atualize a lista se receber um aviso de conflito.
- Desativar, reabrir ou mudar o ciclo/semestre do vencedor retira sua escolha. A exclusão também a remove. Alterar as indicações não substitui automaticamente a decisão do professor.

## Persistência e futura página WordPress

A tabela `semester_awards` guarda `cycle`, `semester`, `project_id`, `selected_by_user_id` e `selected_at`. Esses registros identificam os vencedores para uma futura integração. A criação da página WordPress, exportação automática e publicação no site da Fatec não foram incluídas nesta alteração.

## Validação

- Foram adicionados testes automatizados para a ordenação e o resumo do grupo (`sortAwardCandidates` e `summarizeAwardGroup`), além dos testes de permissões, critérios, empates, elegibilidade, decisão manual, retirada, conflitos e rotas HTTP já existentes.
- A lógica dos dois novos helpers foi executada isoladamente no Node contra as mesmas expectativas dos testes. A suíte completa (`npm test`), `npm run lint`, `npx tsc --noEmit` e `npm run build`, a conferência visual no navegador e a execução da migração em um PostgreSQL de teste ainda precisam ser feitas no ambiente de desenvolvimento, pois a interface e a migração foram reescritas nesta alteração.

A compatibilidade Git é relativa à main incluída no ZIP. Novos commits na main remota depois dessa versão podem exigir outra integração antes do pull request. O repositório foi entregue com histórico Git; não houve push nem criação de pull request.
