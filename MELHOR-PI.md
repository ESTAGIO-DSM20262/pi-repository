# Melhor PI do semestre

A branch `feat/acessibilidade` mantém as melhorias de acessibilidade e incorpora a main fornecida no ZIP, no commit `2540191`. O conflito no painel de indicações foi resolvido preservando a validação de formulário e a restauração de foco.

## Antes de usar

1. Instale as dependências com `npm ci` e configure as variáveis descritas em `.env.example`.
2. No banco PostgreSQL/Neon do projeto, aplique `src/db/migrations/20261105_semester_awards.sql`, depois das migrações existentes que criam `users` e `projects`. O SQL é transacional e pode ser reaplicado. Não apaga projetos nem indicações.
3. Inicie o sistema e acesse o painel como administrador ou orientador principal de um projeto.

O comando `npm run db:migrate` não executa essa migração manual. Nenhuma alteração foi aplicada ao banco remoto durante esta entrega.

## Como funciona

- A seção **Melhor PI do semestre** aparece no painel administrativo e no painel de professores que são orientadores principais. Lista os projetos cadastrados, com busca por nome e filtros por semestre do curso e ciclo. Projetos demonstrativos não participam.
- Cada combinação de ciclo letivo e semestre do curso tem um único vencedor. Por exemplo, `2026-2 / 2º semestre` é uma seleção independente de `2026-2 / 3º semestre` e de `2025-2 / 2º semestre`.
- O administrador pode escolher qualquer projeto elegível. O professor pode escolher apenas os projetos em que consta como orientador principal. Participar como professor satélite não concede permissão de escolha nem de retirada.
- O detalhe do projeto também mostra a seção para o orientador principal e o administrador. Após alterar uma indicação, os pontos são recarregados junto com os dados da página.
- Cada um dos sete critérios distintos indicados vale um ponto. Repetições do mesmo critério não multiplicam a pontuação. São consideradas indicações de orientadores atualmente vinculados e de administradores.
- A recomendação considera todos os projetos ativos e concluídos daquele ciclo e semestre, independentemente dos filtros da tela. Empates são exibidos como recomendações equivalentes. Sem pontos, não há recomendação automática.
- A decisão é manual: um projeto com pontuação menor, ou até sem indicação, pode ser escolhido. Antes de substituir um vencedor, o sistema informa o projeto que perderá a escolha e pede confirmação.
- Uma escolha concorrente não é sobrescrita silenciosamente: atualize a lista se receber um aviso de conflito.
- Desativar, reabrir ou mudar o ciclo/semestre do vencedor retira sua escolha. A exclusão também a remove. Alterar as indicações não substitui automaticamente a decisão do professor.

## Persistência e futura página WordPress

A tabela `semester_awards` guarda `cycle`, `semester`, `project_id`, `selected_by_user_id` e `selected_at`. Esses registros identificam os vencedores para uma futura integração. A criação da página WordPress, exportação automática e publicação no site da Fatec não foram incluídas nesta alteração.

## Validação

- Testes automatizados de permissões, critérios, empates, elegibilidade, decisão manual, retirada, conflitos e rotas HTTP, além da suíte existente.
- Migração exercitada em PostgreSQL temporário com PGlite: reaplicação, unicidade, substituição, rejeição de satélite e retirada por mudança/exclusão do projeto.
- Interface conferida com dados simulados no navegador, sem usar contas ou dados reais.
- Para repetir as verificações do projeto: `npm test`, `npm run lint`, `npx tsc --noEmit` e `npm run build`.

Resultado desta entrega: 259 testes passaram em 34 arquivos; lint e verificação de tipos aprovados. A conferência no navegador cobriu busca sem acentos, limpeza de filtros, bloqueio da ação de satélite, confirmação/substituição e layouts desktop, celular e escuro com texto a 200%, sem rolagem horizontal. O banco remoto e sessões reais não foram usados nos testes.

O build completo não pôde ser validado neste ambiente Windows: o modo padrão foi bloqueado ao criar um junction do Turbopack; `npm run build -- --webpack` compilou o código e os tipos, mas a geração de páginas foi interrompida por `EPERM` ao criar diretórios em `.next/server/app` (rotas existentes `/perfil` e `/login`). Execute o build completo no ambiente habitual de desenvolvimento ou CI antes de publicar.

A compatibilidade Git é relativa à main incluída no ZIP. Novos commits na main remota depois dessa versão podem exigir outra integração antes do pull request. O repositório foi entregue com histórico Git; não houve push nem criação de pull request.
