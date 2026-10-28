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

> **Convenção de exports:** use apenas exports nomeados (`export function X`,
> `import { X } from …`). `export default` fica restrito aos arquivos especiais do
> Next.js em `src/app` (`page`, `layout`, `loading`, `error`, `not-found`,
> `template`, `default`, `global-error`), aos arquivos `*.config.*` e aos
> templates React Email em `src/infrastructure/email/templates/*.tsx` (o preview
> `npm run email:dev` só carrega o export default; esses arquivos exportam o
> componente nomeado **e** `export default`). A regra `style/noDefaultExport` do
> Biome garante isso (exceções em `overrides` no `biome.json`).

> **Convenção de imports:**
>
> | Caso | Formato |
> | --- | --- |
> | Módulo do projeto | `import { X } from '@/components/ui/Modal'` — named import, nunca default |
> | Arquivo de outra pasta | alias `@/` (→ `src/`), sem `../` |
> | Arquivo da mesma pasta | relativo `./`: `import { FormFeedback } from './FormFeedback'` |
> | Só tipos | `import type { Role } from '@/domain/enterprise/entities/role'` |
> | Valores e tipos juntos | `type` inline: `import { Modal, type Notice } from '@/components/ui/Modal'` |
> | Pacote externo | como a lib exporta: `import Link from 'next/link'`, `import { useForm } from 'react-hook-form'`; `import * as` só quando a lib exige (`import * as XLSX from 'xlsx'`) |
>
> Importe direto do arquivo que declara o item; não crie barrels (`index.ts` que só
> reexporta). A ordem dos imports (pacotes, depois `@/`, depois `./`) é feita pelo
> `organizeImports` do Biome em `npm run lint:fix` e no pre-commit — não ordene à mão.

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
│  │  ├─ invalid-email-error.ts
│  │  ├─ invalid-reset-token-error.ts
│  │  └─ email-delivery-error.ts
│  └─ repositories/
│     ├─ auth-repository.ts        # PORTA AuthRepository
│     └─ password-reset-notifier.ts  # PORTA PasswordResetNotifier
├─ application/auth/
│  ├─ dtos/login-credentials.ts    # LoginCredentials (alias da porta)
│  ├─ sign-in.ts                   # SignInUseCase
│  ├─ sign-in-with-microsoft.ts    # SignInWithMicrosoftUseCase
│  ├─ sign-out.ts                  # SignOutUseCase
│  ├─ request-password-reset.ts    # RequestPasswordResetUseCase
│  ├─ reset-password.ts            # ResetPasswordUseCase
│  ├─ send-password-reset-email.ts # SendPasswordResetEmailUseCase (servidor)
│  └─ *.test.ts
├─ infrastructure/
│  ├─ auth/auth-client.ts          # createAuthClient() (cliente better-auth)
│  ├─ auth/better-auth-auth-repository.ts  # implementa AuthRepository
│  ├─ auth/better-auth-user-mapper.ts      # better-auth -> User (domain)
│  ├─ email/resend-password-reset-notifier.ts   # implementa PasswordResetNotifier (Resend)
│  ├─ email/console-password-reset-notifier.ts  # adaptador de desenvolvimento
│  ├─ email/make-password-reset-notifier.ts     # escolhe o adaptador pelo ambiente
│  ├─ email/templates/brand.ts                  # tema Tailwind e marca para e-mails
│  ├─ email/templates/password-reset-email.tsx  # template React Email
│  ├─ email/templates/render-password-reset-email.ts  # assunto + HTML + texto
│  └─ http/api-client.ts           # wrapper de fetch
├─ test/repositories/              # implementações in-memory das portas (testes)
├─ presentation/auth/
│  ├─ auth-context.tsx             # AuthProvider/useAuth + composition root
│  ├─ role-label.ts                # rótulos PT para exibição
│  └─ validation.ts                # schemas Zod dos formulários (inclui newPasswordSchema)
├─ presentation/profile/
│  ├─ profile-record.ts            # tipo ProfileRecord usado pela tela /perfil
│  ├─ validation.ts                # schemas Zod do perfil e da troca de senha
│  ├─ change-password.ts           # troca de senha via authClient
│  └─ social-profile-url.ts        # validação/normalização de links GitHub/LinkedIn
├─ components/profile/             # tela /perfil dividida em componentes
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
- `RequestPasswordResetUseCase.execute({ email, redirectTo })` — normaliza o
  e-mail e delega a `requestPasswordReset`; devolve `Either<AuthenticationError, void>`.
- `ResetPasswordUseCase.execute({ token, newPassword })` — delega a
  `resetPassword`; devolve `Either<InvalidResetTokenError | AuthenticationError, void>`.
- `SendPasswordResetEmailUseCase.execute({ email, name, active, resetUrl })` —
  roda **no servidor** e recebe a porta `PasswordResetNotifier`. Não envia nada
  para contas inativas (devolve `right`), valida o destinatário com
  `EmailAddress` (`left(InvalidEmailError)`) e repassa o `Either` do notifier
  (`EmailDeliveryError` em falha).

Não há `GetSessionUseCase` de propósito: a assinatura reativa da sessão
(`authClient.useSession()`) é um detalhe de framework e permanece na
apresentação.

## 7. Infraestrutura (adaptadores)

- **Porta** (`domain/enterprise/repositories/auth-repository.ts`): interface
  `AuthRepository` com `signInWithEmail`, `signInWithMicrosoft`, `signOut`,
  `requestPasswordReset` e `resetPassword`. Define também `SignInCredentials`,
  `MicrosoftSignInInput`, `PasswordResetRequest`, `PasswordResetInput` e os
  tipos de resultado.
- **Adaptador** (`infrastructure/auth/better-auth-auth-repository.ts`,
  `'use client'`): implementa a porta usando `authClient`; traduz os erros do
  better-auth em erros de domínio (`toInvalidCredentials`; código
  `INVALID_TOKEN` → `InvalidResetTokenError`).
- **Porta** (`domain/enterprise/repositories/password-reset-notifier.ts`):
  `PasswordResetNotifier.notify({ to, name, resetUrl })` devolve
  `Either<EmailDeliveryError, void>`. Adaptadores em `infrastructure/email/`:
  `ResendPasswordResetNotifier` (SDK `resend`, renderiza o template e mapeia
  erros do Resend para `EmailDeliveryError`) e `ConsolePasswordResetNotifier`
  (desenvolvimento: imprime o link no console do servidor).
  `makePasswordResetNotifier()` é o único ponto que lê `RESEND_API_KEY` e
  `EMAIL_FROM`: com ambos usa o Resend; sem eles usa o console fora de produção e,
  em produção, um notifier que sempre devolve `EmailDeliveryError` (não lança no
  carregamento, para não quebrar o `next build`).
- **Templates de e-mail** (`infrastructure/email/templates/`): componentes
  **React Email** (`@react-email/components`) estilizados com **Tailwind** via
  `<Tailwind config={emailTailwindConfig}>` — use `className` com as mesmas
  classes do app (`bg-primary`, `text-text-secondary`, `border-border`…), nunca
  objetos `style`. No `render()`, as classes viram estilos inline (cores em `rgb()`,
  medidas em px graças ao `pixelBasedPreset` e aos raios fixos), pois clientes de
  e-mail não suportam folhas de estilo nem variáveis CSS. `<Head>` fica dentro de
  `<Tailwind>`. `renderPasswordResetEmail` gera o HTML e a versão em texto
  (`plainText: true`); o React escapa nome e URL. `brand.ts` exporta
  `emailTailwindConfig` — cores, raios e fonte (Plus Jakarta Sans, fallback Arial)
  que **espelham** os tokens de `src/app/globals.css`; ao mudar a paleta do app,
  atualize os dois — e `emailBrand` (textos da marca: "F", "Acervo Acadêmico",
  instituição).
  Visualize com `npm run email:dev` (http://localhost:3001); `PreviewProps` no
  componente define os dados de exemplo.
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
- Formulários usam **react-hook-form + Zod** (`zodResolver`, `mode: 'onTouched'`); não guarde
  valores de campo, "touched", carregamento ou erro em `useState`. Erros vindos do servidor vão
  em `setError('root.server', …)`, o carregamento vem de `formState.isSubmitting` e a mensagem de
  sucesso de `formState.isSubmitSuccessful` (com `reset(..., { keepIsSubmitSuccessful: true })`).

### Tela de perfil (`/perfil`)

`components/profile/ProfilePage.tsx` só compõe: guarda o `ProfileRecord` salvo (para o
resumo refletir o que o servidor devolveu) e renderiza `ProfilePageHeader`, `ProfileSummary`,
`ProfileForm` (dados da conta + links sociais, `PATCH /api/profile`) e `ChangePasswordForm`
(`authClient.changePassword`). Os schemas ficam em `presentation/profile/validation.ts`:
`createProfileSchema(isAdmin)` só valida nome/e-mail para administradores (os demais não podem
alterá-los e eles não são enviados), `socialProfileUrlSchema` reaproveita
`validateSocialProfileUrl` e devolve a URL normalizada ou `null`, e `changePasswordSchema`
reaproveita `newPasswordSchema` de `presentation/auth/validation.ts`, o mesmo usado em
`/redefinir-senha`. A API continua revalidando tudo no servidor.

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

### Redefinição de senha (e-mail via Resend)

1. `/esqueci-senha`: `ForgotPasswordForm` valida com `forgotPasswordSchema` e
   chama `useAuth().requestPasswordReset(email)` →
   `RequestPasswordResetUseCase` → `authClient.requestPasswordReset({ email,
   redirectTo: '/redefinir-senha' })`. A tela sempre mostra a mesma mensagem
   genérica de sucesso, exista ou não a conta.
2. No servidor, o better-auth gera um token (1 hora, `resetPasswordTokenExpiresIn`)
   e chama `emailAndPassword.sendResetPassword` em `src/libs/auth.ts` (o
   *composition root* do servidor), que executa `SendPasswordResetEmailUseCase`
   com o notifier de `makePasswordResetNotifier()`. Um `Left` é apenas registrado
   com `console.error`, nunca lançado, para a resposta não revelar se o e-mail
   existe. Contas inativas não recebem e-mail.
3. O link do e-mail aponta para `/api/auth/reset-password/:token`, que redireciona
   para `/redefinir-senha?token=…` ou, se o token for inválido/expirado, para
   `/redefinir-senha?error=INVALID_TOKEN`.
4. `ResetPasswordForm` lê `token`/`error` com `useSearchParams()` (a página envolve
   o formulário em `<Suspense>`). Sem token ou com erro, renderiza
   `InvalidResetLink`. Caso contrário, valida com `resetPasswordSchema` e chama
   `useAuth().resetPassword(token, senha)` → `ResetPasswordUseCase` →
   `authClient.resetPassword`.
5. Em sucesso, o better-auth revoga todas as sessões da conta
   (`revokeSessionsOnPasswordReset`) e o modal leva para `/login`. Contas só da
   Microsoft ganham uma senha nesse processo (o better-auth cria a conta
   `credential`).

Variáveis: `RESEND_API_KEY` e `EMAIL_FROM` (remetente de um domínio verificado no
Resend). Sem elas, fora de produção, o link aparece no console do `npm run dev`.

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

- `src/db/schema.ts` descreve as tabelas do better-auth (`users`, `sessions`,
  `accounts`, `verifications`) e as tabelas de domínio (`project_favorites`,
  `project_progress_tasks`, `project_progress_revisions` e `projects`). Os nomes físicos
  usam plural e as colunas usam `snake_case`.
- `users.role` é `text().$type<Role>()`, preenchido **apenas no servidor**; nunca vem do cliente.
- `users.registration_number`, `course`, `active`, `github_url` e `linkedin_url` armazenam os
  dados de matrícula, estado da conta e links públicos usados no perfil e nas páginas de projetos.
- **Fontes de migração:** `drizzle/` mantém as migrações Drizzle já existentes; os SQLs manuais em
  `src/db/migrations/` provisionam/atualizam tabelas de domínio e extensões do usuário e precisam
  ser executados no Neon em ordem de dependência. `npm run db:migrate` não executa esses SQLs.
  Antes de gerar uma migração nova, revise o diff do Drizzle Kit: o snapshot histórico de `drizzle/`
  não registra todas as tabelas já gerenciadas por SQL manual, então gerar cegamente pode propor
  recriar objetos que já existem. Mantenha as definições de `schema.ts` refletidas no SQL manual.
- `src/db/seed.ts` pré-provisiona contas de desenvolvimento com papéis explícitos.
- Comandos: `npm run db:generate`, `db:migrate`, `db:push`, `db:seed`, `db:studio`, `db:check`.

## 13. Testes

- **Vitest** (`vitest.config.ts`); os testes ficam ao lado do código
  (`*.test.ts`). Rodar: `npm test` (ou `npm run test:watch`).
- Cobertura inclui `email-address.test.ts` (normalização, aceitação de domínios diversos e rejeição de formato inválido) e `user.test.ts` (criação da entidade e papel explícito).
  - `sign-in.test.ts` — normalização do e-mail e propagação de erro, usando um
    `InMemoryAuthRepository` (o que demonstra a testabilidade da porta).
  - `request-password-reset.test.ts`, `reset-password.test.ts` e
    `send-password-reset-email.test.ts` — normalização, token inválido/reuso,
    contas inativas e falha de entrega.
- As implementações *in-memory* das portas ficam em `src/test/repositories/`
  (`InMemoryAuthRepository`, `InMemoryPasswordResetNotifier`) e são
  compartilhadas pelos testes.
  - `presentation/profile/validation.test.ts` — links sociais, regras de nome/e-mail por
    papel e regras/confirmação da nova senha.

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
| `npm run email:dev` | preview dos templates React Email (porta 3001) |

## 16. Cadastro de projetos e filtros do painel

- **Persistência:** projetos criados pela interface ficam na tabela `projects`
  (`src/db/migrations/20261021_projects.sql`, espelhada em `db/schema.ts`). Os projetos
  demonstrativos continuam em `mock-projects.ts`. `DbProjectRepository`
  (`infrastructure/projects/db-project-repository.ts`) lê somente registros persistidos e faz
  a busca por ID diretamente no banco. `CompositeProjectRepository` combina o adaptador de banco
  com `MockProjectRepository` na raiz de composição. Erros de banco não são ocultados.
- **Validação:** `application/projects/create-project.ts` (`parseCreateProjectInput`) valida e
  normaliza a entrada e devolve `Either<InvalidProjectError, CreateProjectInput>`. O formulário usa
  React Hook Form + Zod (`presentation/projects/validation.ts`, `mode: 'onTouched'`) e também valida
  no servidor. Exige título, resumo, ciclo `AAAA/1|2`, semestre 1–6, tema, orientador principal e ao menos um
  aluno. Orientadores adicionais são opcionais (veja a seção 18). As tarefas iniciais são opcionais e o responsável precisa pertencer à equipe.
- **Aplicação e persistência:** `CreateProjectUseCase` (`application/projects/create-project-use-case.ts`)
  valida o papel do usuário, revalida orientador e alunos ativos e monta as tarefas iniciais.
  `ProjectRepository` é a porta de escrita; `DbProjectCommandRepository` grava projeto, tarefas
  e revisões. `DbProjectUserDirectory` implementa a porta de consulta de contas e pessoas. Os casos
  de uso são testados com implementações in-memory; falhas esperadas retornam
  `Either<ProjectOperationError, ...>`.
- **Tela:** `/projetos/novo` e `/projetos/[id]/editar` usam o mesmo componente,
  `components/projects/ProjectFormPage.tsx` (`mode="create" | "edit"`), restrito a professor e
  administrador. O botão "Novo Projeto" do painel aponta para a criação.
- **Filtros do painel:** a seção de projetos de administrador e professor tem busca (título,
  orientador, tema, aluno), filtro de situação, filtro de semestre (1º ao 6º), filtro de orientador
  (inclui co-orientadores) e filtro de semestre letivo (`AAAA/1|2`), este último um
  `SelectDropdown` de seleção única montado a partir dos semestres letivos existentes na lista,
  com a contagem de projetos em cada opção (`Filters.cycle`, `presentation/projects/project-filters.ts`). A lista de usuários do
  administrador ganhou o filtro de status (ativo/inativo), ao lado do filtro de perfil.
- **Dropdowns:** todo seletor usa `components/ui/SelectDropdown`. Dentro de modais, use
  `layer="modal"` para o menu ficar acima do diálogo.

## 17. Edição de projetos e artefatos

- **Quem edita:** `application/projects/project-permissions.ts` (`resolveProjectEditScope`) é a
  única fonte da regra, usada por `libs/project-edit-access.ts` (`resolveProjectEditAccess`) e pela
  página do projeto. **Qualquer** professor orientador do projeto (principal ou adicional) tem escopo
  `full` (todos os dados, equipe, tecnologias, orientadores adicionais e artefatos). O administrador
  tem escopo `admin` em qualquer projeto: edita os professores orientadores, os links e as imagens;
  funções/liderança da equipe e os demais campos do corpo são ignorados. Aluno nunca edita. Projetos
  demonstrativos (`mock-projects.ts`) não existem na tabela `projects` e por isso não são editáveis.
  Projeto desativado só pode ser editado por administrador.
- **Rota e tela:** `/projetos/[id]/editar` (servidor) carrega o projeto e renderiza
  `ProjectFormPage` com `mode="edit"` e o `scope` devolvido pelo acesso. A página do projeto
  mostra o botão vermelho "Editar projeto" quando `canEditProject` é verdadeiro.
- **Aplicação e API:** `POST /api/projects` e `PATCH /api/projects/[id]` delegam a orquestração a
  `CreateProjectUseCase` e `UpdateProjectUseCase` (`application/projects/`), que dependem das
  portas `ProjectRepository`, `ProjectUserDirectory` e `ProjectVerificationRepository`. Os testes
  usam implementações in-memory. No escopo `full`, a equipe é recalculada a partir dos alunos ativos
  e remover um aluno com tarefa individual atribuída devolve 409. `publicDetails` é mesclado para
  preservar o que o corpo não envia (por exemplo, `images` quando a lista não é enviada).
- **Tarefas:** não são editadas nesta tela. Na criação, as tarefas iniciais continuam opcionais; na
  edição, a tela aponta para a seção de progresso da página do projeto.
- **Botão de voltar:** `components/ui/BackButton.tsx` é o único botão de voltar das páginas
  internas. Com `href` navega para o destino; sem `href` volta no histórico (ou para `/`). O link
  "Voltar para o login" dentro dos cartões de autenticação é um link de texto e não faz parte do
  padrão.
- **Migrações de restrições:** `src/db/migrations/20261022_project_constraints.sql` garante que os índices e checks do schema existam também em bancos Neon que receberam migrações manuais parciais. O script usa `IF NOT EXISTS`/consultas a `pg_constraint` para poder ser repetido sem recriar restrições já corretas. Os índices de usuários também estão em `20261014_admin_user_registration.sql`; os checks de progresso, em `20261014_project_progress.sql`; e os checks de semestre/status, em `20261021_projects.sql`. Os arquivos desta pasta são SQL manual: execute-os em ordem cronológica no SQL Editor do Neon. `npm run db:migrate` usa o diretório `drizzle/` e não aplica automaticamente estes arquivos manuais.

## 18. Orientadores, desativação e exclusão

- **Vários orientadores:** o projeto tem um orientador principal (`projects.advisor_email/name`) e
  orientadores adicionais (`projects.co_advisors`, jsonb de `{ email, name }`), até 5 no total
  (`MAX_PROJECT_ADVISORS`). Todos têm exatamente as mesmas permissões: editar o projeto, criar
  tarefas, verificar e ver o projeto em andamento. Use sempre `getProjectAdvisors`,
  `isProjectAdvisor` (`domain/enterprise/entities/project-advisors.ts`) e `isAdvisorOf`
  (`project-permissions.ts`); não compare com `project.advisor` diretamente.
- **Quem altera a lista:** o professor adiciona e remove orientadores adicionais, mas não pode se
  remover (devolve 400) nem trocar o principal. O administrador também troca o principal (o antigo
  sai da lista, a menos que seja mantido como adicional). Orientadores novos são revalidados como
  professores ativos; os já existentes mantêm o nome gravado.
- **Desativar:** somente o administrador (`SetProjectActivationUseCase`,
  `PATCH /api/projects/[id]/activation` com `{ active: boolean }`). `projects.active` e
  `deactivated_at`. Projeto desativado fica oculto para todos, inclusive orientadores e alunos; só o
  administrador o vê, com selo "Desativado" no card e aviso na página (`canViewProject`). Também não
  pode ser favoritado.
- **Excluir:** somente o administrador e somente com o projeto desativado
  (`DeleteProjectUseCase`, `DELETE /api/projects/[id]`, 409 se ativo). A exclusão apaga, em um único
  lote, revisões, tarefas, favoritos e o projeto; as verificações saem por `ON DELETE CASCADE`.
  Projetos demonstrativos não podem ser desativados nem excluídos.
- **Tarefas por autor:** `GET /api/projects/[id]/progress` devolve `createdByName`,
  `lastEditedByName`, `lastEditedAt` e `canEdit` por tarefa, e `changedByName` nas revisões. O
  professor só edita as tarefas que ele mesmo criou (`canEditProgressTask`, 403 no `PATCH` caso
  contrário); o administrador edita qualquer uma. Tarefas criadas por um administrador (por exemplo,
  as iniciais de um projeto criado por ele) só o administrador edita. A criação continua liberada a
  todos os orientadores.

## 19. Indicação de projetos

Na interface o termo é **"indicado"** (antes "verificado"): o professor orientador _indica_ o
projeto como referência. O código e o banco mantêm os nomes `verified`, `verification` e
`project_verifications`; só os textos exibidos mudaram.

- **Quando existe:** somente para projetos concluídos (`status = 'publicado'`) e ativos. Professores
  orientadores e administradores veem o botão "Indicar projeto" ao lado de "Editar projeto";
  em andamento, ele não aparece.
- **Fluxo:** o botão abre um modal com os critérios em checkbox (`VERIFICATION_CRITERIA` em
  `domain/enterprise/entities/project-verification.ts`: código-fonte, documentação, resultado final,
  arquitetura, testes e qualidade, interface e usabilidade, processo de desenvolvimento). É preciso
  marcar ao menos um. `POST /api/projects/[id]/verification` chama `VerifyProjectUseCase`; o
  orientador pode atualizar a própria indicação.
- **Quando o projeto é indicado:** quando **todos** os orientadores atuais indicaram
  (`buildVerificationSummary`). Então `projects.verified` vira `true`, o selo "Indicado" aparece e a
  página mostra "Este projeto é indicado em: …" com os critérios marcados por pelo menos um
  orientador, como tags clicáveis (os que não foram unânimes mostram "N/M").
- **Detalhe do critério (qualquer visitante):** clicar na tag abre um cartão com a descrição do
  critério (`statement`, o mesmo texto do modal de indicação) e os nomes dos orientadores que o
  indicaram. Fecha com a própria tag, o botão de fechar ou `Esc`. Não depende de banco: a descrição
  vem de `VERIFICATION_CRITERIA` e os nomes de `summary.advisors[].criteria`.
- **Orientadores e administradores** veem também a barra de progresso e quem já indicou ou falta.
- **Administrador:** pode registrar a própria indicação, mas ela é listada à parte e **não conta**
  para completar o projeto; apenas orientadores completam.
- **Consistência:** adicionar um orientador a um projeto indicado volta o projeto para não
  indicado; remover um orientador apaga a indicação dele e recalcula; voltar o projeto para
  "em andamento" apaga todas as indicações. A tabela é `project_verifications`
  (`20261027_project_advisors_verification.sql`), uma linha por projeto e verificador.
- **Vários orientadores na página do projeto:** com mais de um, aparecem como cartões em grade
  (nome completo, GitHub e LinkedIn); com um só, mantém a linha compacta.

## 20. Tecnologias, links e imagens

- **Tecnologias:** o campo continua aberto. `TechnologyPicker` sugere itens do catálogo
  (`domain/enterprise/entities/technology-catalog.ts`) enquanto a pessoa digita e mostra os mais
  usados. A padronização acontece no servidor (`normalizeTechnologyList`): o nome digitado ou um
  apelido conhecido vira o nome oficial ("nodejs" → "Node.js") e duplicadas são removidas, mesmo
  escritas de formas diferentes. Nomes fora do catálogo são mantidos como digitados. Para incluir uma
  tecnologia no catálogo, adicione uma entrada em `TECHNOLOGY_CATALOG` (o teste impede apelidos
  ambíguos entre tecnologias).
- **Links:** lista totalmente personalizável em `publicDetails.externalLinks`
  (`{ label, url, icon }`, até 12, HTTPS). A pessoa adiciona modelos (`PROJECT_LINK_PRESETS`:
  repositório, site no ar, protótipo, documentação, vídeo etc.) ou um link personalizado com título,
  endereço e ícone. O ícone vem do catálogo `PROJECT_LINK_ICONS` (classes `fi-rr-*` que existem no
  CSS carregado); um ícone fora do catálogo é trocado por `fi-rr-link` no servidor. Links antigos sem
  ícone usam o ícone do título conhecido. Não há migração.
- **Documentos anexados:** a opção foi removida do cadastro, da edição, do modelo
  (`ProjectAttachment`) e da página do projeto.
- **Imagens (envio ainda não funcional):** o campo, as regras e a exibição estão prontos.
  Limites em `PROJECT_IMAGE_LIMITS` (`domain/enterprise/entities/project-images.ts`): PNG, JPG ou
  WEBP, até 5 MB, até 8 imagens, lado entre 320 px e 6000 px; `validateProjectImage` é pura e
  testada. Depois de enviar, a pessoa escolhe a orientação de cada imagem (horizontal ou vertical;
  `suggestImageOrientation` já sugere pela proporção). `ProjectImageGallery` exibe as horizontais em
  16:9 e as verticais em moldura de celular 9:16. As imagens ficam em `publicDetails.images`
  (`{ title, url, orientation }`) e o `PATCH` já valida e grava a lista quando ela é enviada. **Para
  ativar o upload (backend):** (1) crie o armazenamento e o endpoint que receba o arquivo, repita
  `validateProjectImage` no servidor e devolva a URL HTTPS pública; (2) implemente
  `uploadProjectImage` em `presentation/projects/project-image-upload.ts`; (3) troque
  `PROJECT_IMAGE_UPLOAD_ENABLED` para `true` no mesmo arquivo. Se o domínio das imagens for fixo,
  configure `images.remotePatterns` e remova `unoptimized` dos componentes `Image`.
- **Ícones:** `fi-rr-code`, `fi-rr-server` e `fi-rr-folder-check` não existem no CSS instalado. O
  código novo usa apenas ícones verificados no catálogo `rounded.css`.

## 21. Dashboards de professor e administrador

- **Onde ficam:** o cálculo é puro e testado em `application/dashboard/dashboard-metrics.ts`
  (`buildProfessorDashboardMetrics`, `buildAdminDashboardMetrics`, `summarizeTasks`); as consultas
  ao banco estão em `infrastructure/dashboard/dashboard-queries.ts` (tarefas de progresso,
  indicações do professor, pessoas ativas e cadastros por mês). `DashboardPage` junta as duas
  partes e entrega as métricas ao `RoleDashboard`; se a consulta falhar, o erro vai para o log e o
  bloco extra simplesmente não aparece. Os gráficos são SVG/CSS em `DashboardWidgets.tsx`, sem
  biblioteca externa.
- **Regras de tarefas:** uma tarefa está _atrasada_ quando não está concluída e o prazo
  (`due_date`) é anterior a hoje (data em `America/Sao_Paulo`); _vence em 7 dias_ quando o prazo é
  hoje ou nos 7 dias seguintes. A taxa de conclusão é concluídas ÷ total. Um projeto em andamento
  está _parado_ quando tem tarefas abertas e nenhuma foi alterada há 14 dias (`STALLED_AFTER_DAYS`),
  _sem tarefas_ quando não tem nenhuma, e _pronto para concluir_ quando todas estão concluídas.
- **Professor** (`ProfessorOverview`): cartões (projetos acompanhados, em andamento, concluídos,
  taxa de conclusão, tarefas em aberto, atrasadas, vencendo em 7 dias, projetos parados); lista de
  atrasadas e próximos prazos (14 dias); progresso por projeto em andamento, ordenado por
  urgência; gráficos de tarefas por situação, projetos por semestre e situação/indicação; carga por
  aluno (tarefas atribuídas a cada um); projetos concluídos que o professor ainda não indicou. Só
  entram projetos ativos em que ele é orientador ou coorientador (`related`).
- **Administrador:** os cartões agora contam apenas projetos **ativos** (desativados aparecem na
  nota do primeiro cartão e em "Pendências"); "Projetos Indicados" é proporcional aos concluídos.
  `AdminInsights` adiciona projetos por situação e por semestre, tarefas do sistema, projetos que
  precisam de atenção (atrasados, parados ou sem tarefas), pendências (concluídos sem indicação,
  em andamento sem tarefas, alunos e professores sem projeto, desativados), carga dos orientadores
  e usuários por perfil com novos cadastros dos últimos 6 meses.
- **Importação de usuários:** as listas de linhas inválidas, ignoradas e usuários criados usam
  `scrollbar-danger`, `scrollbar-warning` e `scrollbar-success` (`globals.css`), com a mesma cor do
  cartão. A lista de criados mostra nome, e-mail e perfil, nunca a senha temporária.
