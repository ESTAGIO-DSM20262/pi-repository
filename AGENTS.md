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
