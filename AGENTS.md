<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Arquitetura — Acervo Acadêmico Fatec

Este documento descreve como o código está organizado depois da adoção de **DDD +
Clean Architecture** (feature de autenticação), *o que* foi feito e *como*.

> **Convenção de documentação:** o código-fonte não deve conter comentários (`//`,
> `/* */`, JSDoc ou comentários JSX/CSS). Toda explicação de regra, decisão ou
> fluxo pertence a este arquivo. Ao alterar o comportamento, atualize esta
> documentação em vez de comentar o código.

## 1. Contexto

O projeto é um app Next.js (App Router) com autenticação via **better-auth**,
persistência em **PostgreSQL/Neon** com **Drizzle ORM** e UI em Tailwind.
Originalmente a lógica de autenticação vivia misturada entre `src/features`,
`src/libs` e componentes. A refatoração separou o domínio das preocupações de
framework.

Escopo: **apenas a fatia vertical de autenticação** foi migrada para a nova
arquitetura. As demais telas continuam como estavam.

## 2. Camadas e regra de dependência

Organização por **camadas globais** (não por feature). A dependência aponta
sempre para dentro: `presentation`/`infrastructure` → `application` → `domain`
→ `core`. Nenhuma camada interna conhece as externas.

| Camada | Pasta | Papel | Pode importar |
| --- | --- | --- | --- |
| `core` | `src/core` | Blocos reutilizáveis e agnósticos: `Either`, `Entity`, `ValueObject`, `UniqueEntityId`, `DomainError`, contrato `UseCase`. | Nada externo |
| `domain` | `src/domain` | Regras de negócio puras: entidades, value objects, erros e **portas** (interfaces). | `core` |
| `application` | `src/application` | Casos de uso: orquestram entidades e dependem só de portas. | `domain`, `core` |
| `infrastructure` | `src/infrastructure` | Adaptadores concretos (better-auth, HTTP) que implementam as portas. | `application`, `domain`, `core` |
| `presentation` | `src/presentation` | Contexto React, validação de formulário, rótulos de UI. | camadas internas |
| `app`/`components` | `src/app`, `src/components` | Rotas (App Router) e componentes visuais. | `presentation`, `infrastructure`, `application` |

**Proibido nas camadas `core`/`domain`/`application`:** importar React, Next,
better-auth, Drizzle, Zod ou `process.env`. Isso é o que mantém o domínio
testável e isomórfico (roda no browser e no Node).

## 3. Árvore de diretórios

```
src/
├─ core/
│  ├─ application/use-case.ts      # interface UseCase<Input, Output>
│  ├─ entities/entity.ts           # base de entidade (identidade)
│  ├─ entities/value-object.ts     # base de value object (imutável)
│  ├─ entities/unique-entity-id.ts # id via Web Crypto (isomórfico)
│  ├─ errors/domain-error.ts       # Error base com `.name` correto
│  └─ either.ts                    # Left/Right/left/right/Either
├─ domain/enterprise/
│  ├─ entities/
│  │  ├─ role.ts                   # ROLES = ['student', 'professor']
│  │  ├─ email-address.ts          # VO: valida e normaliza endereço de e-mail
│  │  ├─ email-address.test.ts
│  │  ├─ user.ts                   # entidade User (role vem do e-mail)
│  │  └─ user.test.ts
│  ├─ errors/
│  │  ├─ authentication-error.ts
│  │  ├─ invalid-credentials-error.ts
│  │  └─ invalid-email-error.ts
│  └─ repositories/auth-repository.ts  # PORTA AuthRepository
├─ application/auth/
│  ├─ dtos/login-credentials.ts    # LoginCredentials (alias da porta)
│  ├─ sign-in.ts                   # SignInUseCase
│  ├─ sign-in-with-microsoft.ts    # SignInWithMicrosoftUseCase
│  ├─ sign-out.ts                  # SignOutUseCase
│  └─ sign-in.test.ts
├─ infrastructure/
│  ├─ auth/auth-client.ts          # createAuthClient() (cliente better-auth)
│  ├─ auth/better-auth-auth-repository.ts  # implementa AuthRepository
│  ├─ auth/better-auth-user-mapper.ts      # better-auth -> User (domain)
│  └─ http/api-client.ts           # wrapper de fetch
├─ presentation/auth/
│  ├─ auth-context.tsx             # AuthProvider/useAuth + composition root
│  ├─ role-label.ts                # rótulos PT para exibição
│  └─ validation.ts                # schemas Zod dos formulários
├─ libs/
│  ├─ auth.ts                      # config do better-auth no SERVIDOR
│  ├─ styles.ts                    # classes utilitárias de UI
│  └─ useResetOnLeave.ts           # hook de reset
├─ db/
│  ├─ index.ts                     # conexão Drizzle (Neon)
│  ├─ schema.ts                    # tabelas better-auth
│  └─ seed.ts                      # contas de desenvolvimento
└─ app/                            # rotas (App Router)
   ├─ api/auth/[...all]/route.ts   # handler better-auth (toNextJsHandler)
   ├─ login/page.tsx
   ├─ painel/page.tsx              # dispatcher por papel
   ├─ aluno/page.tsx               # área do aluno (student)
   └─ professor/page.tsx           # área do professor (professor)
```

`src/libs/` foi mantido de propósito para código que **não** pertence ao domínio
(`auth.ts` de servidor, `styles.ts`, `useResetOnLeave.ts`).

## 4. Result pattern (`Either`)

Toda operação que pode falhar por regra de negócio devolve
`Either<Erro, Sucesso>` (`@/core/either`), em vez de `throw`:

- `left(erro)` / `right(valor)`; classes `Left`/`Right` com narrowing
  (`isLeft()` / `isRight()` e `result.value` tipado).
- O domínio e a aplicação **nunca lançam** por falha esperada; a exceção é a
  fronteira de UI (ver `auth-context.tsx`), que converte `Left` em `throw` para
  que o formulário exiba a mensagem.
- Erros de domínio estendem `DomainError` (que estende `Error` e ajusta
  `.name` via `new.target.name`), então são seguros de lançar na UI.

## 5. Domínio de autenticação

### Papéis (`role.ts`)

- Vocabulário do domínio em **inglês**: `student` | `professor`.
- O banco persiste exatamente esses valores.
- Rótulos em português (`Aluno`/`Professor`) ficam na apresentação
  (`presentation/auth/role-label.ts`). As rotas seguem em PT (`/aluno`,
  `/professor`).

### `EmailAddress` (value object)

`@/domain/enterprise/entities/email-address.ts` normaliza o endereço (`trim().toLowerCase()`) e valida apenas o formato geral do e-mail. O domínio/sufixo não determina o tipo de usuário nem suas permissões. A criação e a alteração do papel são realizadas de forma explícita pelo painel administrativo.

### `User` (entidade)

`@/domain/enterprise/entities/user.ts` devolve `Either<InvalidEmailError, User>` e guarda o papel persistido na conta (`student`, `professor` ou `admin`). O papel não é inferido a partir do e-mail.

## 6. Casos de uso (camada de aplicação)

Cada caso de uso implementa `UseCase` e recebe a porta `AuthRepository` por
injeção no construtor:

- `SignInUseCase.execute(credentials)` — normaliza o e-mail e delega a
  `signInWithEmail`; devolve `Either<InvalidCredentialsError, { user }>`.
- `SignInWithMicrosoftUseCase.execute({ callbackURL, errorCallbackURL })` —
  delega a `signInWithMicrosoft`; devolve `Either<AuthenticationError, void>`.
- `SignOutUseCase.execute()` — delega a `signOut`.

Não há `GetSessionUseCase` de propósito: a assinatura reativa da sessão
(`authClient.useSession()`) é um detalhe de framework e permanece na
apresentação.

## 7. Infraestrutura (adaptadores)

- **Porta** (`domain/enterprise/repositories/auth-repository.ts`): interface
  `AuthRepository` com `signInWithEmail`, `signInWithMicrosoft` e `signOut`.
  Define também `SignInCredentials`, `MicrosoftSignInInput` e
  `EmailSignInResult`.
- **Adaptador** (`infrastructure/auth/better-auth-auth-repository.ts`,
  `'use client'`): implementa a porta usando `authClient`; traduz os erros do
  better-auth em erros de domínio (`toInvalidCredentials`).
- **Mapper** (`infrastructure/auth/better-auth-user-mapper.ts`): `toDomainUser`
  converte o usuário do better-auth em `User` (ou `null` se o e-mail for
  inválido). Sem `'use client'`, então serve ao cliente **e** ao servidor.
- **Cliente better-auth** (`infrastructure/auth/auth-client.ts`): apenas
  `createAuthClient()`.

## 8. Apresentação e composição

`presentation/auth/auth-context.tsx` é o **composition root do cliente**: cria a
implementação concreta (`BetterAuthAuthRepository`), injeta nos casos de uso e
expõe `useAuth()` com `{ user, loading, signIn, signInWithMicrosoft, signOut }`.
Aqui os `Left` de regra de negócio são convertidos em `throw` para a UI.

- `AuthProvider` faz o wiring e usa `authClient.useSession()` para a sessão.
- `validation.ts` centraliza os schemas Zod e valida o formato geral de e-mail; nenhum sufixo específico é obrigatório.
- `AuthProvider` é montado em `src/app/layout.tsx`.

## 9. Rotas e proteção (server-side)

- `login/page.tsx`: página pública; renderiza `LoginForm`/`LoginFeedback`.
- `painel/page.tsx`: **dispatcher**. Lê a sessão no servidor, exige autenticação
  e redireciona para `/professor` ou `/aluno` conforme o papel.
- `aluno/page.tsx` e `professor/page.tsx`: **áreas protegidas**. Além de exigir
  sessão, redirecionam quem não tem o papel correspondente.
- `api/auth/[...all]/route.ts`: `toNextJsHandler(auth)` expõe os endpoints do
  better-auth.

**Regra importante:** o papel (`student`, `professor` ou `admin`) é explícito e
vem do campo `role` persistido no banco, mapeado pela sessão. Nunca derive o
papel do domínio/sufixo do e-mail. As páginas usam `export const instant = false`
para leitura de sessão a cada requisição (bloqueia a rota).

## 10. Fluxos

### Login por e-mail/senha

1. `LoginForm` valida com `loginSchema` e chama `useAuth().signIn`.
2. `AuthProvider` chama `SignInUseCase.execute`.
3. O caso de uso normaliza o e-mail e chama `AuthRepository.signInWithEmail`.
4. `BetterAuthAuthRepository` usa `authClient.signIn.email`; em sucesso, mapeia
   para `User` e devolve `right({ user })`; em falha, `left(InvalidCredentialsError)`.
5. Em `left`, o provider lança; o formulário mostra a mensagem. Em sucesso, o
   formulário navega para `/painel`.

### Login com Microsoft (Entra ID)

1. `LoginForm` chama `signInWithMicrosoft`.
2. `SignInWithMicrosoftUseCase` → `AuthRepository.signInWithMicrosoft` →
   `authClient.signIn.social({ provider: 'microsoft', ... })`.
3. `callbackURL = /painel`, `errorCallbackURL = /login`.
4. No servidor, o better-auth usa `mapProfileToUser` (fallback do UPN `preferred_username` quando falta o claim `email`). O papel persistido da conta é mantido; contas criadas por autenticação social sem um papel explícito recebem `student` como padrão. O formato do e-mail é validado sem restrição de domínio.
5. `LoginFeedback` traduz os códigos de erro do callback OAuth em mensagens PT.

## 11. Regra do papel e o bug do loop de redirecionamento

Problema histórico: contas tinham `role = 'aluno'` (valor antigo em PT),
enquanto o guard esperava `student`/`professor`; o guard estrito fazia
`/aluno` ↔ `/professor` entrar em loop.

Correções aplicadas (as duas, juntas):

1. **Migração de dados** `drizzle/20261011165539_rename_role_values`:
   `UPDATE "users" SET "role" = 'student' WHERE "role" = 'aluno'`.
2. **Papel persistido na leitura**: as páginas usam o papel definido na conta, sem derivá-lo do e-mail.

A escrita do papel é feita no servidor, por cadastro ou gestão administrativa, e aceita `student`, `professor` e `admin` independentemente do sufixo do e-mail.

## 12. Banco de dados e migrações

- `db/schema.ts` define as tabelas do better-auth: `users`, `sessions`,
  `accounts`, `verifications` (nomes físicos no plural, colunas em snake_case —
  ver `usePlural` na config).
- `users.role` é `text().$type<Role>()`, preenchido **apenas no servidor**;
  nunca vem do cliente.
- `db/seed.ts` pré-provisiona contas com papéis explícitos.
- `users.github_url` e `users.linkedin_url` armazenam os links públicos opcionais usados no perfil e nas páginas dos projetos.
- Comandos: `npm run db:generate`, `db:migrate`, `db:push`, `db:seed`,
  `db:studio`, `db:check`.

## 13. Testes

- **Vitest** (`vitest.config.ts`); os testes ficam ao lado do código
  (`*.test.ts`). Rodar: `npm test` (ou `npm run test:watch`).
- Cobertura inclui `email-address.test.ts` (normalização, aceitação de domínios diversos e rejeição de formato inválido) e `user.test.ts` (criação da entidade e papel explícito).
  - `sign-in.test.ts` — normalização do e-mail e propagação de erro, usando um
    `InMemoryAuthRepository` (o que demonstra a testabilidade da porta).

## 14. Como evoluir (receita para uma nova fatia)

1. **Domínio** (`src/domain/<contexto>/`): entidades/value objects (base de
   `core`), erros de domínio e a **porta** (interface de repositório).
2. **Aplicação** (`src/application/<contexto>/`): casos de uso que implementam
   `UseCase` e recebem portas por injeção.
3. **Infraestrutura** (`src/infrastructure/`): adaptador concreto que implementa
   a porta e um mapper para o formato externo.
4. **Apresentação** (`src/presentation/`): contexto/hooks e validação; faça o
   *composition root* injetar o adaptador no caso de uso.
5. **Rotas/UI** (`src/app`, `src/components`): consuma a apresentação.
6. **Testes** `*.test.ts` com implementações *in-memory* das portas.

Mantenha a regra de dependência, não importe framework em `core`/`domain`/
`application`, use `Either` para falhas esperadas e **não comente o código** —
documente aqui.

## 15. Comandos úteis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run start` | servir o build |
| `npm run lint` | checagem Biome (`biome check`) |
| `npm run lint:fix` | Biome com correções/format |
| `npm test` | testes (Vitest, one-shot) |
| `npm run test:watch` | testes em watch |
| `npm run db:migrate` | aplica migrações Drizzle |
| `npm run db:seed` | cria contas de desenvolvimento |

## 16. Cadastro de projetos e filtros do painel

- **Persistência:** projetos criados pela interface ficam na tabela `projects`
  (`src/db/migrations/20261021_projects.sql`, espelhada em `db/schema.ts`). Os projetos
  demonstrativos continuam em `mock-projects.ts`. `DbProjectRepository`
  (`infrastructure/projects/db-project-repository.ts`) devolve os dois conjuntos juntos e
  implementa `findById`, usado por dashboard, home, página do projeto, favoritos e acesso ao
  progresso. Se a tabela ainda não existir, o repositório registra o erro e exibe só os demonstrativos.
- **Validação:** `application/projects/create-project.ts` (`parseCreateProjectInput`) valida e
  normaliza a entrada e devolve `Either<InvalidProjectError, CreateProjectInput>`. Exige título,
  resumo, ciclo `AAAA/1|2`, semestre 1–12, tema, orientador e ao menos um aluno. As tarefas iniciais
  são opcionais (zero ou mais) e o responsável de cada tarefa precisa ser um aluno do projeto.
- **API:** `POST /api/projects` aceita apenas professor ou administrador ativos. O professor é sempre o
  orientador do que cria; o administrador escolhe um professor ativo. Alunos precisam existir, estar
  ativos e ter o papel `student`. Projeto, tarefas (versões `v1.0`, `v2.0`…) e revisões `created` são
  gravados em uma única `db.batch`.
- **Tela:** `/projetos/novo` e `/projetos/[id]/editar` usam o mesmo componente,
  `components/projects/ProjectFormPage.tsx` (`mode="create" | "edit"`), restrito a professor e
  administrador. O botão "Novo Projeto" do painel aponta para a criação.
- **Filtros do painel:** a seção de projetos de administrador e professor tem busca (título,
  orientador, tema, aluno), filtro de situação, filtro de semestre (1º ao 6º) e filtro de ciclo
  (`AAAA/1|2`, montado a partir dos ciclos existentes na lista). A lista de usuários do
  administrador ganhou o filtro de status (ativo/inativo), ao lado do filtro de perfil.
- **Dropdowns:** todo seletor usa `components/ui/SelectDropdown`. Dentro de modais, use
  `layer="modal"` para o menu ficar acima do diálogo.

## 17. Edição de projetos e artefatos

- **Quem edita:** `libs/project-edit-access.ts` (`resolveProjectEditAccess`) é a única fonte da regra.
  O professor **orientador** do projeto tem escopo `full` (todos os dados, equipe, tecnologias e
  artefatos). O administrador tem escopo `artifacts` em qualquer projeto (somente links e,
  futuramente, imagens e arquivos). Aluno nunca edita. Projetos demonstrativos (`mock-projects.ts`)
  não existem na tabela `projects` e por isso não são editáveis.
- **Rota e tela:** `/projetos/[id]/editar` (servidor) carrega o projeto e renderiza
  `ProjectFormPage` com `mode="edit"` e o `scope` devolvido pelo acesso. A página do projeto
  mostra o botão vermelho "Editar projeto" quando `canEditProject` é verdadeiro. O orientador não
  pode ser trocado na edição.
- **API:** `PATCH /api/projects/[id]` valida com `parseUpdateProjectInput(body, scope)`
  (`application/projects/update-project.ts`). No escopo `artifacts` só os links são lidos; o resto
  do corpo é ignorado. No escopo `full`, a equipe é recalculada a partir da tabela `users`. Remover
  um aluno que ainda tem tarefa individual atribuída devolve 409: reatribua ou exclua a tarefa antes.
  `publicDetails` é sempre mesclado (`...currentDetails`) para preservar `attachments` e `images`.
- **Tarefas:** não são editadas nesta tela. Na criação, as tarefas iniciais continuam opcionais; na
  edição, a tela aponta para a seção de progresso da página do projeto.
- **Links dos artefatos:** ficam em `publicDetails.externalLinks`, sem migração. Rótulos fixos em
  `PROJECT_LINK_LABELS` (`domain/enterprise/entities/project-details.ts`): `Repositório`,
  `Site no ar` e `Protótipo`. Qualquer outro rótulo é um link adicional (título + endereço, até 10).
  Todos precisam ser HTTPS. `splitProjectLinks` e `buildProjectLinks` convertem entre a lista
  persistida e os campos do formulário.
- **Imagens e arquivos (ainda não funcionais):** o formulário já traz os campos
  (`UploadSlot`, desabilitados por padrão, com `onFiles` e `disabled` prontos para a implementação).
  O modelo já prevê `publicDetails.images` (`ProjectImage`) e `publicDetails.attachments`
  (`ProjectAttachment`). Para ativar: implemente o armazenamento e o endpoint de upload, passe
  `disabled={false}` e `onFiles` ao `UploadSlot` correspondente e inclua as listas no
  `PATCH` (hoje elas são preservadas, não editadas).
- **Botão de voltar:** `components/ui/BackButton.tsx` é o único botão de voltar das páginas
  internas. Com `href` navega para o destino; sem `href` volta no histórico (ou para `/`). O link
  "Voltar para o login" dentro dos cartões de autenticação é um link de texto e não faz parte do
  padrão.
